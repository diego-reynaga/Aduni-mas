-- Keep Excel imports inside one database transaction.  The Edge Function is
-- responsible only for parsing and validating the file; this function records
-- its history, observations and grade snapshot together or rolls back all of
-- them.  It prevents the long chain of PostgREST writes that could exhaust the
-- Edge Function request window.
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

  -- The existing RPC validates authorization, roster membership, every grade,
  -- and recalculates the detail, competency and final averages consistently
  -- with manual edits.
  v_guardado := public.guardar_notas_competencias(
    p_asignacion_id,
    p_trimestre,
    p_competencias,
    p_estudiantes
  );

  select coalesce(pg_catalog.array_agg(
    nullif(coalesce(student.value ->> 'estudiante_id', student.value ->> 'estudianteId'), '')::uuid
  ), array[]::uuid[])
  into v_estudiantes_ids
  from pg_catalog.jsonb_array_elements(p_estudiantes) as student(value);

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

revoke all on function public.confirmar_importacion_notas(
  uuid, public.trimestre, text, text, jsonb, integer, integer, text, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.confirmar_importacion_notas(
  uuid, public.trimestre, text, text, jsonb, integer, integer, text, jsonb, jsonb, jsonb
) to authenticated;

comment on function public.confirmar_importacion_notas(
  uuid, public.trimestre, text, text, jsonb, integer, integer, text, jsonb, jsonb, jsonb
) is 'Confirma una importación Excel en una sola transacción y conserva la edición posterior desde el acta docente.';
