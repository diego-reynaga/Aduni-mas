-- Atomic student administration used only by the authenticated admin Edge Function.
-- The function is SECURITY INVOKER and executable only by service_role.

create or replace function public.admin_manage_student(
  p_action text,
  p_student_id uuid default null,
  p_person jsonb default '{}'::jsonb,
  p_student jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_actor_username text default 'sistema'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_action text := lower(trim(coalesce(p_action, '')));
  v_student_id uuid := p_student_id;
  v_person_id uuid;
  v_result jsonb;
  v_nombres text;
  v_apellidos text;
  v_tipo_documento text;
  v_documento text;
  v_correo text;
  v_codigo text;
  v_activo boolean;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = p_actor_id
      and p.rol = 'ADMINISTRADOR'::public.app_role
      and p.activo
  ) then
    raise exception using errcode = '42501', message = 'Solo un administrador activo puede gestionar estudiantes.';
  end if;

  if v_action not in ('crear', 'actualizar', 'activar', 'desactivar') then
    raise exception using errcode = '22023', message = 'Acción de estudiante no válida.';
  end if;

  if v_action in ('crear', 'actualizar') then
    v_nombres := nullif(trim(p_person->>'nombres'), '');
    v_apellidos := nullif(trim(p_person->>'apellidos'), '');
    v_tipo_documento := coalesce(nullif(trim(p_person->>'tipoDocumento'), ''), 'DNI');
    v_documento := nullif(trim(p_person->>'documentoIdentidad'), '');
    v_correo := lower(nullif(trim(p_person->>'correo'), ''));
    v_codigo := upper(nullif(trim(p_student->>'codigoEstudiante'), ''));
    v_activo := coalesce((p_student->>'activo')::boolean, true);

    if v_nombres is null or v_apellidos is null or v_documento is null or v_codigo is null then
      raise exception using errcode = '23514', message = 'Nombres, apellidos, documento y código de estudiante son obligatorios.';
    end if;
  end if;

  if v_action = 'crear' then
    insert into public.personas (
      nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento,
      genero, direccion, telefono, correo, activo
    ) values (
      v_nombres,
      v_apellidos,
      v_tipo_documento,
      v_documento,
      nullif(p_person->>'fechaNacimiento', '')::date,
      nullif(trim(p_person->>'genero'), ''),
      nullif(trim(p_person->>'direccion'), ''),
      nullif(trim(p_person->>'telefono'), ''),
      v_correo,
      true
    ) returning id into v_person_id;

    insert into public.estudiantes (persona_id, codigo, activo)
    values (v_person_id, v_codigo, v_activo)
    returning id into v_student_id;
  elsif v_action = 'actualizar' then
    if v_student_id is null then
      raise exception using errcode = '22023', message = 'Debe indicar el estudiante que desea actualizar.';
    end if;

    select e.persona_id into v_person_id
    from public.estudiantes e
    where e.id = v_student_id
    for update;

    if v_person_id is null then
      raise exception using errcode = 'P0002', message = 'El estudiante no existe.';
    end if;

    update public.personas
    set nombres = v_nombres,
        apellidos = v_apellidos,
        tipo_documento = v_tipo_documento,
        numero_documento = v_documento,
        fecha_nacimiento = nullif(p_person->>'fechaNacimiento', '')::date,
        genero = nullif(trim(p_person->>'genero'), ''),
        direccion = nullif(trim(p_person->>'direccion'), ''),
        telefono = nullif(trim(p_person->>'telefono'), ''),
        correo = v_correo,
        updated_at = now()
    where id = v_person_id;

    update public.estudiantes
    set codigo = v_codigo,
        activo = v_activo,
        updated_at = now()
    where id = v_student_id;
  else
    if v_student_id is null then
      raise exception using errcode = '22023', message = 'Debe indicar el estudiante que desea modificar.';
    end if;

    update public.estudiantes
    set activo = (v_action = 'activar'),
        updated_at = now()
    where id = v_student_id
    returning persona_id into v_person_id;

    if v_person_id is null then
      raise exception using errcode = 'P0002', message = 'El estudiante no existe.';
    end if;
  end if;

  insert into public.auditoria (
    usuario_id, accion, entidad, entidad_id, usuario_responsable, detalle
  ) values (
    p_actor_id,
    case v_action
      when 'crear' then 'CREAR_ESTUDIANTE'
      when 'actualizar' then 'ACTUALIZAR_ESTUDIANTE'
      when 'activar' then 'ACTIVAR_ESTUDIANTE'
      else 'DESACTIVAR_ESTUDIANTE'
    end,
    'estudiantes',
    v_student_id,
    coalesce(nullif(trim(p_actor_username), ''), 'sistema'),
    jsonb_build_object('persona_id', v_person_id, 'accion', v_action)
  );

  select jsonb_build_object(
    'id', e.id,
    'personaId', p.id,
    'codigoEstudiante', e.codigo,
    'activo', e.activo,
    'nombres', p.nombres,
    'apellidos', p.apellidos,
    'tipoDocumento', p.tipo_documento,
    'documentoIdentidad', p.numero_documento,
    'fechaNacimiento', p.fecha_nacimiento,
    'genero', p.genero,
    'correo', p.correo,
    'telefono', p.telefono,
    'direccion', p.direccion
  ) into v_result
  from public.estudiantes e
  join public.personas p on p.id = e.persona_id
  where e.id = v_student_id;

  return v_result;
end;
$$;

revoke all on function public.admin_manage_student(text, uuid, jsonb, jsonb, uuid, text) from public;
revoke all on function public.admin_manage_student(text, uuid, jsonb, jsonb, uuid, text) from anon;
revoke all on function public.admin_manage_student(text, uuid, jsonb, jsonb, uuid, text) from authenticated;
grant execute on function public.admin_manage_student(text, uuid, jsonb, jsonb, uuid, text) to service_role;

comment on function public.admin_manage_student(text, uuid, jsonb, jsonb, uuid, text)
is 'Operación atómica de persona + estudiante. Solo invocable por service_role desde administrar-estudiante.';

-- Bind note writes to the exact active assignment and its grade/management.
create or replace function private.is_estudiante_en_asignacion(
  p_estudiante_id uuid,
  p_asignacion_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.asignaciones_docente a
    join public.cursos c on c.id = a.curso_id and c.activo
    join public.periodos pe on pe.id = a.periodo_id
    join public.matriculas m on m.grado_id = c.grado_id
      and m.gestion_id = pe.gestion_id
      and m.estado = 'ACTIVA'::public.estado_matricula
    where a.id = p_asignacion_id
      and a.estado = 'ACTIVA'::public.estado_asignacion
      and m.estudiante_id = p_estudiante_id
  )
$$;

revoke all on function private.is_estudiante_en_asignacion(uuid, uuid) from public;
grant execute on function private.is_estudiante_en_asignacion(uuid, uuid) to authenticated;

-- Remove the original permissive policies as well. PostgreSQL combines policies
-- with OR, so leaving them in place would bypass the stricter enrollment check.
drop policy if exists notas_docente_insert on public.notas;
drop policy if exists notas_docente_update on public.notas;
drop policy if exists notas_docente_or_admin_insert on public.notas;
create policy notas_docente_or_admin_insert on public.notas for insert to authenticated
with check (
  (select private.is_admin())
  or (
    registrado_por = (select auth.uid())
    and (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.is_estudiante_en_asignacion(estudiante_id, asignacion_docente_id))
  )
);

drop policy if exists notas_docente_or_admin_update on public.notas;
create policy notas_docente_or_admin_update on public.notas for update to authenticated
using (
  (select private.is_admin())
  or (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.is_estudiante_en_asignacion(estudiante_id, asignacion_docente_id))
  )
)
with check (
  (select private.is_admin())
  or (
    registrado_por = (select auth.uid())
    and (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.is_estudiante_en_asignacion(estudiante_id, asignacion_docente_id))
  )
);
