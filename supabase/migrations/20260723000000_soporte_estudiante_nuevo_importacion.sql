-- Automatic creation and enrollment of new students during Excel grade import.
-- If an Excel file includes a student not yet present in the active roster,
-- this RPC creates their Persona, Estudiante and Matricula in the same
-- transaction before calling guardar_notas_competencias.

create or replace function public.confirmar_importacion_notas(
  p_asignacion_id uuid,
  p_trimestre public.trimestre,
  p_nombre_archivo text,
  p_hash_archivo text,
  p_metadata jsonb,
  p_total_registros integer,
  p_registros_validos integer,
  p_detalle text,
  p_competencias jsonb,
  p_estudiantes jsonb,
  p_errores jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text;
  v_importacion_id uuid;
  v_estado public.estado_importacion;
  v_guardado jsonb;
  v_estudiantes_ids uuid[] := array[]::uuid[];
  v_grado_id uuid;
  v_gestion_id uuid;
  v_estudiante_obj jsonb;
  v_nombre_excel text;
  v_es_nuevo boolean;
  v_estudiante_id uuid;
  v_apellidos text;
  v_nombres text;
  v_doc_num text;
  v_persona_id uuid;
  v_estudiante_code text;
  v_matricula_code text;
  v_processed_estudiantes jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Sesión requerida.';
  end if;

  if p_total_registros not between 0 and 100
    or p_registros_validos not between 0 and p_total_registros
  then
    raise exception using errcode = '22023', message = 'Los totales de importación no son válidos.';
  end if;

  if p_errores is null or pg_catalog.jsonb_typeof(p_errores) <> 'array' then
    raise exception using errcode = '22023', message = 'Los errores de importación deben ser un arreglo JSON.';
  end if;

  select username into v_username
  from public.profiles
  where id = v_user_id and activo;
  if not found then
    raise exception using errcode = '42501', message = 'Perfil inactivo o inexistente.';
  end if;

  select c.grado_id, pe.gestion_id
  into v_grado_id, v_gestion_id
  from public.asignaciones_docente a
  join public.cursos c on c.id = a.curso_id
  join public.periodos pe on pe.id = a.periodo_id
  where a.id = p_asignacion_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'La asignación docente no existe.';
  end if;

  -- Register any new student included in the import payload before saving grades
  if p_estudiantes is not null and pg_catalog.jsonb_typeof(p_estudiantes) = 'array' then
    for v_estudiante_obj in select value from pg_catalog.jsonb_array_elements(p_estudiantes) loop
      v_estudiante_id := nullif(coalesce(
        v_estudiante_obj ->> 'estudiante_id',
        v_estudiante_obj ->> 'estudianteId'
      ), '')::uuid;
      v_nombre_excel := nullif(pg_catalog.btrim(coalesce(
        v_estudiante_obj ->> 'nombre_excel',
        v_estudiante_obj ->> 'nombreExcel',
        v_estudiante_obj ->> 'nombre',
        ''
      )), '');
      v_es_nuevo := coalesce(
        (v_estudiante_obj ->> 'es_nuevo')::boolean,
        (v_estudiante_obj ->> 'esNuevo')::boolean,
        false
      );

      if v_estudiante_id is null or v_es_nuevo or not exists (
        select 1
        from public.matriculas m
        where m.estudiante_id = v_estudiante_id
          and m.grado_id = v_grado_id
          and m.gestion_id = v_gestion_id
          and m.estado = 'ACTIVA'::public.estado_matricula
      ) then
        if v_nombre_excel is null then
          raise exception using errcode = '22023', message = 'El nombre del estudiante es obligatorio para su registro.';
        end if;

        if pg_catalog.strpos(v_nombre_excel, ',') > 0 then
          v_apellidos := nullif(pg_catalog.btrim(pg_catalog.split_part(v_nombre_excel, ',', 1)), '');
          v_nombres := nullif(pg_catalog.btrim(pg_catalog.split_part(v_nombre_excel, ',', 2)), '');
        else
          declare
            v_parts text[] := pg_catalog.string_to_array(pg_catalog.btrim(v_nombre_excel), ' ');
            v_len integer := pg_catalog.cardinality(v_parts);
          begin
            if v_len <= 1 then
              v_apellidos := v_nombre_excel;
              v_nombres := v_nombre_excel;
            elsif v_len = 2 then
              v_apellidos := v_parts[1];
              v_nombres := v_parts[2];
            elsif v_len = 3 then
              v_apellidos := v_parts[1] || ' ' || v_parts[2];
              v_nombres := v_parts[3];
            else
              v_apellidos := v_parts[1] || ' ' || v_parts[2];
              v_nombres := pg_catalog.array_to_string(v_parts[3:v_len], ' ');
            end if;
          end;
        end if;

        if v_apellidos is null then v_apellidos := v_nombre_excel; end if;
        if v_nombres is null then v_nombres := v_apellidos; end if;

        loop
          v_doc_num := '9' || pg_catalog.lpad(pg_catalog.floor(pg_catalog.random() * 10000000)::text, 7, '0');
          exit when not exists (select 1 from public.personas where numero_documento = v_doc_num);
        end loop;

        v_estudiante_code := 'EST-' || v_doc_num;
        v_matricula_code := 'MAT-' || v_doc_num;

        insert into public.personas (
          nombres, apellidos, tipo_documento, numero_documento, activo
        ) values (
          v_nombres, v_apellidos, 'DNI', v_doc_num, true
        ) returning id into v_persona_id;

        insert into public.estudiantes (
          persona_id, codigo, activo
        ) values (
          v_persona_id, v_estudiante_code, true
        ) returning id into v_estudiante_id;

        insert into public.matriculas (
          codigo, estudiante_id, grado_id, gestion_id, fecha_matricula, estado
        ) values (
          v_matricula_code, v_estudiante_id, v_grado_id, v_gestion_id, current_date, 'ACTIVA'::public.estado_matricula
        );

        v_estudiante_obj := pg_catalog.jsonb_set(v_estudiante_obj, '{estudiante_id}', pg_catalog.to_jsonb(v_estudiante_id::text));
        v_estudiante_obj := pg_catalog.jsonb_set(v_estudiante_obj, '{estudianteId}', pg_catalog.to_jsonb(v_estudiante_id::text));
      end if;

      v_processed_estudiantes := v_processed_estudiantes || pg_catalog.jsonb_build_array(v_estudiante_obj);
    end loop;
  else
    v_processed_estudiantes := p_estudiantes;
  end if;

  v_estado := case
    when p_registros_validos = 0 then 'FALLIDA'::public.estado_importacion
    when pg_catalog.jsonb_array_length(p_errores) > 0 then 'OBSERVADA'::public.estado_importacion
    else 'PROCESADA'::public.estado_importacion
  end;

  insert into public.importaciones_notas (
    asignacion_docente_id, usuario_id, nombre_archivo, hash_archivo, trimestre,
    anio, nivel, institucion, lugar, area_curricular, docente_excel, grado,
    seccion, total_registros, registros_validos, registros_observados, estado,
    confirmada, detalle
  ) values (
    p_asignacion_id, v_user_id, pg_catalog.left(pg_catalog.btrim(p_nombre_archivo), 180),
    nullif(pg_catalog.left(pg_catalog.btrim(p_hash_archivo), 128), ''), p_trimestre,
    nullif(p_metadata ->> 'anio', '')::integer,
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'nivel'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'institucion'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'lugar'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'areaCurricular'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'docente'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'grado'), 255), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'seccion'), 255), ''),
    p_total_registros, p_registros_validos, p_total_registros - p_registros_validos,
    v_estado, true, nullif(pg_catalog.left(pg_catalog.btrim(p_detalle), 1000), '')
  ) returning id into v_importacion_id;

  insert into public.errores_importacion_notas (
    importacion_id, fila_excel, estudiante_texto, campo, descripcion, critico
  )
  select
    v_importacion_id,
    error_row.fila_excel,
    nullif(pg_catalog.left(pg_catalog.btrim(error_row.estudiante_texto), 180), ''),
    nullif(pg_catalog.left(pg_catalog.btrim(error_row.campo), 80), ''),
    pg_catalog.left(pg_catalog.btrim(error_row.descripcion), 500),
    coalesce(error_row.critico, false)
  from pg_catalog.jsonb_to_recordset(p_errores) as error_row(
    fila_excel integer,
    estudiante_texto text,
    campo text,
    descripcion text,
    critico boolean
  );

  v_guardado := public.guardar_notas_competencias(
    p_asignacion_id,
    p_trimestre,
    p_competencias,
    v_processed_estudiantes
  );

  select coalesce(pg_catalog.array_agg(
    nullif(coalesce(student.value ->> 'estudiante_id', student.value ->> 'estudianteId'), '')::uuid
  ), array[]::uuid[])
  into v_estudiantes_ids
  from pg_catalog.jsonb_array_elements(v_processed_estudiantes) as student(value);

  if pg_catalog.cardinality(v_estudiantes_ids) > 0 then
    update public.calificacion_detalle_trimestre
    set importacion_id = v_importacion_id
    where asignacion_docente_id = p_asignacion_id
      and trimestre = p_trimestre
      and estudiante_id = any(v_estudiantes_ids);

    update public.calificacion_competencia_trimestre
    set importacion_id = v_importacion_id
    where asignacion_docente_id = p_asignacion_id
      and trimestre = p_trimestre
      and estudiante_id = any(v_estudiantes_ids);

    update public.notas
    set importacion_id = v_importacion_id
    where asignacion_docente_id = p_asignacion_id
      and trimestre = p_trimestre
      and tipo = 'PROMEDIO_FINAL'::public.tipo_nota
      and estudiante_id = any(v_estudiantes_ids);
  end if;

  insert into public.auditoria (
    usuario_id, accion, entidad, entidad_id, usuario_responsable, detalle
  ) values (
    v_user_id, 'IMPORTAR_NOTAS_TRIMESTRE', 'importaciones_notas',
    v_importacion_id, v_username,
    pg_catalog.jsonb_build_object(
      'trimestre', p_trimestre,
      'asignacionId', p_asignacion_id,
      'archivo', p_nombre_archivo,
      'registros', p_total_registros,
      'importados', p_registros_validos
    )
  );

  return pg_catalog.jsonb_build_object(
    'idImportacion', v_importacion_id,
    'message', case when v_estado = 'PROCESADA'::public.estado_importacion
      then 'Importación confirmada correctamente.'
      else 'Importación confirmada con observaciones.' end,
    'competenciasGuardadas', coalesce((v_guardado ->> 'competenciasRecalculadas')::integer, 0),
    'promediosFinalesGuardados', coalesce((v_guardado ->> 'promediosFinalesGuardados')::integer, 0)
  );
end;
$$;
