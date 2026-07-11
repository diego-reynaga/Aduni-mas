-- Unify manual and Excel grade registration around four competencies with
-- three to six configurable capacities each.

-- Imported grade rows used the Excel column as their logical capacity key.
-- Introduce an explicit, stable position before making the Excel provenance
-- nullable for manually registered grades.
alter table public.calificacion_detalle_trimestre
  add column numero_capacidad integer;

update public.calificacion_detalle_trimestre
set numero_capacidad = case numero_competencia
  when 1 then pg_catalog.array_position(
    array['F', 'G', 'H', 'I', 'J', 'K']::text[],
    pg_catalog.upper(pg_catalog.btrim(columna_excel))
  )
  when 2 then pg_catalog.array_position(
    array['M', 'N', 'O', 'P', 'Q', 'R']::text[],
    pg_catalog.upper(pg_catalog.btrim(columna_excel))
  )
  when 3 then pg_catalog.array_position(
    array['T', 'U', 'V', 'W', 'X', 'Y']::text[],
    pg_catalog.upper(pg_catalog.btrim(columna_excel))
  )
  when 4 then pg_catalog.array_position(
    array['AA', 'AB', 'AC', 'AD', 'AE', 'AF']::text[],
    pg_catalog.upper(pg_catalog.btrim(columna_excel))
  )
end
where numero_capacidad is null;

do $$
begin
  if exists (
    select 1
    from public.calificacion_detalle_trimestre
    where numero_capacidad is null
  ) then
    raise exception using
      errcode = '23514',
      message = 'No se pudo derivar numero_capacidad para una o más columnas Excel históricas.';
  end if;
end
$$;

alter table public.calificacion_detalle_trimestre
  alter column numero_capacidad set not null,
  add constraint calificacion_detalle_numero_capacidad_check
    check (numero_capacidad between 1 and 6);

-- Drop the former Excel-column uniqueness constraint without relying on its
-- automatically truncated PostgreSQL name.
do $$
declare
  v_constraint name;
begin
  for v_constraint in
    select c.conname
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.calificacion_detalle_trimestre'::regclass
      and c.contype = 'u'
      and pg_catalog.pg_get_constraintdef(c.oid) =
        'UNIQUE (estudiante_id, asignacion_docente_id, trimestre, numero_competencia, columna_excel)'
  loop
    execute pg_catalog.format(
      'alter table public.calificacion_detalle_trimestre drop constraint %I',
      v_constraint
    );
  end loop;
end
$$;

alter table public.calificacion_detalle_trimestre
  add constraint calificacion_detalle_trimestre_slot_key unique (
    estudiante_id,
    asignacion_docente_id,
    trimestre,
    numero_competencia,
    numero_capacidad
  ),
  alter column columna_excel drop not null,
  alter column fila_excel drop not null;

-- An import is provenance, not ownership of the grade. Preserve grades if an
-- import history row is removed and allow manual grades to have no import.
do $$
declare
  v_constraint name;
begin
  for v_constraint in
    select c.conname
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.calificacion_detalle_trimestre'::regclass
      and c.confrelid = 'public.importaciones_notas'::regclass
      and c.contype = 'f'
      and pg_catalog.array_length(c.conkey, 1) = 1
      and c.conkey[1] = (
        select a.attnum
        from pg_catalog.pg_attribute a
        where a.attrelid = 'public.calificacion_detalle_trimestre'::regclass
          and a.attname = 'importacion_id'
          and not a.attisdropped
      )
  loop
    execute pg_catalog.format(
      'alter table public.calificacion_detalle_trimestre drop constraint %I',
      v_constraint
    );
  end loop;
end
$$;

alter table public.calificacion_detalle_trimestre
  alter column importacion_id drop not null,
  add constraint calificacion_detalle_importacion_fk
    foreign key (importacion_id)
    references public.importaciones_notas(id)
    on delete set null;

do $$
declare
  v_constraint name;
begin
  for v_constraint in
    select c.conname
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.calificacion_competencia_trimestre'::regclass
      and c.confrelid = 'public.importaciones_notas'::regclass
      and c.contype = 'f'
      and pg_catalog.array_length(c.conkey, 1) = 1
      and c.conkey[1] = (
        select a.attnum
        from pg_catalog.pg_attribute a
        where a.attrelid = 'public.calificacion_competencia_trimestre'::regclass
          and a.attname = 'importacion_id'
          and not a.attisdropped
      )
  loop
    execute pg_catalog.format(
      'alter table public.calificacion_competencia_trimestre drop constraint %I',
      v_constraint
    );
  end loop;
end
$$;

alter table public.calificacion_competencia_trimestre
  alter column importacion_id drop not null,
  add constraint calificacion_competencia_importacion_fk
    foreign key (importacion_id)
    references public.importaciones_notas(id)
    on delete set null;

create table public.configuracion_competencias_docente (
  id uuid primary key default gen_random_uuid(),
  asignacion_docente_id uuid not null
    references public.asignaciones_docente(id) on delete cascade,
  trimestre public.trimestre not null,
  numero_competencia integer not null,
  nombre_competencia text not null,
  nombres_capacidades text[] not null
    default array['PRACTICA', 'EXAMEN', 'CUADERNO']::text[],
  actualizado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracion_competencias_trimestre_check
    check (trimestre <> 'ANUAL'::public.trimestre),
  constraint configuracion_competencias_numero_check
    check (numero_competencia between 1 and 4),
  constraint configuracion_competencias_nombre_check
    check (pg_catalog.char_length(pg_catalog.btrim(nombre_competencia)) between 1 and 255),
  constraint configuracion_competencias_capacidades_check
    check (
      pg_catalog.cardinality(nombres_capacidades) between 3 and 6
      and pg_catalog.array_position(nombres_capacidades, null) is null
    ),
  constraint configuracion_competencias_docente_key unique (
    asignacion_docente_id,
    trimestre,
    numero_competencia
  )
);

create index configuracion_competencias_asignacion_idx
  on public.configuracion_competencias_docente(asignacion_docente_id, trimestre);

comment on table public.configuracion_competencias_docente is
  'Cuatro competencias por asignación y trimestre; cada una define entre tres y seis capacidades ordenadas.';

comment on column public.configuracion_competencias_docente.nombres_capacidades is
  'El índice 1..6 del arreglo es el numero_capacidad estable usado por el detalle de notas.';

-- Seed all current assignments and all supported trimesters. Prefer names from
-- the most recently imported data; complete missing slots with safe defaults.
insert into public.configuracion_competencias_docente (
  asignacion_docente_id,
  trimestre,
  numero_competencia,
  nombre_competencia,
  nombres_capacidades,
  actualizado_por
)
select
  asignacion.id,
  trimestre.valor,
  competencia.numero,
  coalesce(
    (
      select nullif(pg_catalog.btrim(resumen.nombre_competencia), '')
      from public.calificacion_competencia_trimestre resumen
      where resumen.asignacion_docente_id = asignacion.id
        and resumen.trimestre = trimestre.valor
        and resumen.numero_competencia = competencia.numero
      order by resumen.updated_at desc, resumen.id
      limit 1
    ),
    (
      select nullif(pg_catalog.btrim(detalle.nombre_competencia), '')
      from public.calificacion_detalle_trimestre detalle
      where detalle.asignacion_docente_id = asignacion.id
        and detalle.trimestre = trimestre.valor
        and detalle.numero_competencia = competencia.numero
      order by detalle.updated_at desc, detalle.id
      limit 1
    ),
    pg_catalog.format('Competencia %s', competencia.numero)
  ),
  array(
    select coalesce(
      (
        select nullif(pg_catalog.btrim(detalle_nombre.nombre_nota), '')
        from public.calificacion_detalle_trimestre detalle_nombre
        where detalle_nombre.asignacion_docente_id = asignacion.id
          and detalle_nombre.trimestre = trimestre.valor
          and detalle_nombre.numero_competencia = competencia.numero
          and detalle_nombre.numero_capacidad = capacidad.numero
        order by detalle_nombre.updated_at desc, detalle_nombre.id
        limit 1
      ),
      case capacidad.numero
        when 1 then 'PRACTICA'
        when 2 then 'EXAMEN'
        when 3 then 'CUADERNO'
        else pg_catalog.format('CAPACIDAD %s', capacidad.numero)
      end
    )
    from pg_catalog.generate_series(
      1,
      greatest(
        3,
        coalesce((
          select max(detalle_max.numero_capacidad)
          from public.calificacion_detalle_trimestre detalle_max
          where detalle_max.asignacion_docente_id = asignacion.id
            and detalle_max.trimestre = trimestre.valor
            and detalle_max.numero_competencia = competencia.numero
        ), 0)
      )
    ) as capacidad(numero)
    order by capacidad.numero
  ),
  perfil.id
from public.asignaciones_docente asignacion
join public.docentes docente on docente.id = asignacion.docente_id
left join public.profiles perfil on perfil.persona_id = docente.persona_id
cross join (
  values
    ('I_TRIMESTRE'::public.trimestre),
    ('II_TRIMESTRE'::public.trimestre),
    ('III_TRIMESTRE'::public.trimestre)
) as trimestre(valor)
cross join pg_catalog.generate_series(1, 4) as competencia(numero)
on conflict (asignacion_docente_id, trimestre, numero_competencia) do nothing;

-- A configured assignment/trimestre may have no rows (after its assignment is
-- cascaded away) or exactly four. The unique key and 1..4 check then guarantee
-- the complete set of competency numbers.
create or replace function private.assert_four_competencias_docente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select count(*)
    into v_count
    from public.configuracion_competencias_docente configuracion
    where configuracion.asignacion_docente_id = old.asignacion_docente_id
      and configuracion.trimestre = old.trimestre;

    if v_count not in (0, 4) then
      raise exception using
        errcode = '23514',
        message = pg_catalog.format(
          'La asignación %s / %s debe conservar exactamente cuatro competencias.',
          old.asignacion_docente_id,
          old.trimestre
        );
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if tg_op = 'INSERT'
      or old.asignacion_docente_id is distinct from new.asignacion_docente_id
      or old.trimestre is distinct from new.trimestre
    then
      select count(*)
      into v_count
      from public.configuracion_competencias_docente configuracion
      where configuracion.asignacion_docente_id = new.asignacion_docente_id
        and configuracion.trimestre = new.trimestre;

      if v_count not in (0, 4) then
        raise exception using
          errcode = '23514',
          message = pg_catalog.format(
            'La asignación %s / %s debe conservar exactamente cuatro competencias.',
            new.asignacion_docente_id,
            new.trimestre
          );
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.assert_four_competencias_docente() from public;

create constraint trigger configuracion_competencias_exactamente_cuatro
after insert or update or delete on public.configuracion_competencias_docente
deferrable initially deferred
for each row execute function private.assert_four_competencias_docente();

-- Future assignments receive the same four defaults for every trimester.
create or replace function private.seed_competencias_docente_asignacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if not exists (select 1 from public.profiles perfil where perfil.id = v_user) then
    v_user := null;
  end if;

  insert into public.configuracion_competencias_docente (
    asignacion_docente_id,
    trimestre,
    numero_competencia,
    nombre_competencia,
    nombres_capacidades,
    actualizado_por
  )
  select
    new.id,
    trimestre.valor,
    competencia.numero,
    pg_catalog.format('Competencia %s', competencia.numero),
    array['PRACTICA', 'EXAMEN', 'CUADERNO']::text[],
    v_user
  from (
    values
      ('I_TRIMESTRE'::public.trimestre),
      ('II_TRIMESTRE'::public.trimestre),
      ('III_TRIMESTRE'::public.trimestre)
  ) as trimestre(valor)
  cross join pg_catalog.generate_series(1, 4) as competencia(numero)
  on conflict (asignacion_docente_id, trimestre, numero_competencia) do nothing;

  return new;
end;
$$;

revoke all on function private.seed_competencias_docente_asignacion() from public;

create trigger asignaciones_docente_seed_competencias
after insert on public.asignaciones_docente
for each row execute function private.seed_competencias_docente_asignacion();

create trigger configuracion_competencias_docente_updated_at
before update on public.configuracion_competencias_docente
for each row execute function private.set_updated_at();

create trigger configuracion_competencias_docente_audit
after insert or update or delete on public.configuracion_competencias_docente
for each row execute function private.audit_row_change();

alter table public.configuracion_competencias_docente enable row level security;

create policy configuracion_competencias_docente_scoped_select
on public.configuracion_competencias_docente
for select
to authenticated
using ((select private.can_access_asignacion(asignacion_docente_id)));

revoke all on table public.configuracion_competencias_docente from public, anon, authenticated;
grant select on table public.configuracion_competencias_docente to authenticated;
grant all on table public.configuracion_competencias_docente to service_role;

-- Atomic write entry point for the teacher UI. Payload contract:
-- p_competencias: exactly four objects with numero_competencia,
--   nombre_competencia and nombres_capacidades (camelCase aliases accepted).
-- p_estudiantes: objects with estudiante_id and exactly four competencias;
--   each competency contains numero_competencia and a `notas` array whose
--   length exactly matches its configured capacities. Null clears a grade.
create or replace function public.guardar_notas_competencias(
  p_asignacion_id uuid,
  p_trimestre public.trimestre,
  p_competencias jsonb,
  p_estudiantes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.app_role;
  v_persona_id uuid;
  v_docente_persona_id uuid;
  v_estado_asignacion public.estado_asignacion;
  v_competencia jsonb;
  v_competencia_estudiante jsonb;
  v_estudiante jsonb;
  v_nota jsonb;
  v_capacidades_json jsonb;
  v_competencias_json jsonb;
  v_notas_json jsonb;
  v_nombres_capacidades text[];
  v_nombre_competencia text;
  v_numeros_competencia integer[] := array[]::integer[];
  v_numeros_estudiante integer[];
  v_estudiantes_ids uuid[] := array[]::uuid[];
  v_estudiante_id uuid;
  v_numero_competencia integer;
  v_numero_capacidad integer;
  v_capacidades_esperadas integer;
  v_valor numeric;
  v_detalles_eliminados integer := 0;
  v_eliminados_actuales integer := 0;
  v_detalles_guardados integer := 0;
  v_competencias_guardadas integer := 0;
  v_finales_guardados integer := 0;
  v_finales_eliminados integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Sesión requerida.';
  end if;

  select perfil.rol, perfil.persona_id
  into v_role, v_persona_id
  from public.profiles perfil
  where perfil.id = v_user_id
    and perfil.activo;

  if not found then
    raise exception using errcode = '42501', message = 'Perfil inactivo o inexistente.';
  end if;

  if v_role <> 'DOCENTE'::public.app_role
    and v_role <> 'ADMINISTRADOR'::public.app_role
  then
    raise exception using errcode = '42501', message = 'Solo docentes y administradores pueden guardar notas.';
  end if;

  select docente.persona_id, asignacion.estado
  into v_docente_persona_id, v_estado_asignacion
  from public.asignaciones_docente asignacion
  join public.docentes docente on docente.id = asignacion.docente_id
  where asignacion.id = p_asignacion_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'La asignación docente no existe.';
  end if;

  if v_estado_asignacion <> 'ACTIVA'::public.estado_asignacion then
    raise exception using errcode = '55000', message = 'La asignación docente está cerrada.';
  end if;

  if v_role = 'DOCENTE'::public.app_role
    and v_docente_persona_id <> v_persona_id
  then
    raise exception using errcode = '42501', message = 'No puede modificar una asignación de otro docente.';
  end if;

  if p_trimestre is null or p_trimestre = 'ANUAL'::public.trimestre then
    raise exception using errcode = '22023', message = 'Seleccione un trimestre válido.';
  end if;

  if p_competencias is null
    or pg_catalog.jsonb_typeof(p_competencias) <> 'array'
    or pg_catalog.jsonb_array_length(p_competencias) <> 4
  then
    raise exception using errcode = '22023', message = 'Debe enviar exactamente cuatro competencias.';
  end if;

  -- Validate the complete configuration before writing any row.
  for v_competencia in
    select elemento.valor
    from pg_catalog.jsonb_array_elements(p_competencias) as elemento(valor)
  loop
    if pg_catalog.jsonb_typeof(v_competencia) <> 'object' then
      raise exception using errcode = '22023', message = 'Cada competencia debe ser un objeto JSON.';
    end if;

    begin
      v_numero_competencia := nullif(coalesce(
        v_competencia ->> 'numero_competencia',
        v_competencia ->> 'numeroCompetencia',
        v_competencia ->> 'numero'
      ), '')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = 'El número de competencia no es válido.';
    end;

    if v_numero_competencia is null or v_numero_competencia not between 1 and 4 then
      raise exception using errcode = '22023', message = 'El número de competencia debe estar entre 1 y 4.';
    end if;

    if v_numero_competencia = any(v_numeros_competencia) then
      raise exception using errcode = '22023', message = 'No se permiten competencias repetidas.';
    end if;
    v_numeros_competencia := pg_catalog.array_append(v_numeros_competencia, v_numero_competencia);

    v_nombre_competencia := pg_catalog.btrim(coalesce(
      v_competencia ->> 'nombre_competencia',
      v_competencia ->> 'nombreCompetencia',
      v_competencia ->> 'nombre',
      ''
    ));
    if pg_catalog.char_length(v_nombre_competencia) not between 1 and 255 then
      raise exception using errcode = '22023', message = 'Cada competencia debe tener un nombre de 1 a 255 caracteres.';
    end if;

    v_capacidades_json := coalesce(
      v_competencia -> 'nombres_capacidades',
      v_competencia -> 'nombresCapacidades'
    );
    if v_capacidades_json is null
      or pg_catalog.jsonb_typeof(v_capacidades_json) <> 'array'
      or pg_catalog.jsonb_array_length(v_capacidades_json) not between 3 and 6
    then
      raise exception using errcode = '22023', message = 'Cada competencia debe tener entre 3 y 6 capacidades.';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_capacidades_json) as capacidad(valor)
      where pg_catalog.jsonb_typeof(capacidad.valor) <> 'string'
    ) then
      raise exception using errcode = '22023', message = 'Los nombres de capacidades deben ser textos.';
    end if;

    select pg_catalog.array_agg(pg_catalog.btrim(capacidad.valor) order by capacidad.orden)
    into v_nombres_capacidades
    from pg_catalog.jsonb_array_elements_text(v_capacidades_json)
      with ordinality as capacidad(valor, orden);

    if exists (
      select 1
      from pg_catalog.unnest(v_nombres_capacidades) as nombre(valor)
      where pg_catalog.char_length(nombre.valor) not between 1 and 100
    ) then
      raise exception using errcode = '22023', message = 'Cada capacidad debe tener un nombre de 1 a 100 caracteres.';
    end if;
  end loop;

  select pg_catalog.array_agg(numero order by numero)
  into v_numeros_competencia
  from pg_catalog.unnest(v_numeros_competencia) as numero;

  if v_numeros_competencia <> array[1, 2, 3, 4]::integer[] then
    raise exception using errcode = '22023', message = 'Las competencias deben contener los números 1, 2, 3 y 4.';
  end if;

  -- Store the four configurations. The deferred constraint protects against
  -- partial groups even if this function is later reused by another client.
  for v_competencia in
    select elemento.valor
    from pg_catalog.jsonb_array_elements(p_competencias) as elemento(valor)
  loop
    v_numero_competencia := coalesce(
      v_competencia ->> 'numero_competencia',
      v_competencia ->> 'numeroCompetencia',
      v_competencia ->> 'numero'
    )::integer;
    v_nombre_competencia := pg_catalog.btrim(coalesce(
      v_competencia ->> 'nombre_competencia',
      v_competencia ->> 'nombreCompetencia',
      v_competencia ->> 'nombre'
    ));
    v_capacidades_json := coalesce(
      v_competencia -> 'nombres_capacidades',
      v_competencia -> 'nombresCapacidades'
    );
    select pg_catalog.array_agg(pg_catalog.btrim(capacidad.valor) order by capacidad.orden)
    into v_nombres_capacidades
    from pg_catalog.jsonb_array_elements_text(v_capacidades_json)
      with ordinality as capacidad(valor, orden);

    insert into public.configuracion_competencias_docente (
      asignacion_docente_id,
      trimestre,
      numero_competencia,
      nombre_competencia,
      nombres_capacidades,
      actualizado_por
    ) values (
      p_asignacion_id,
      p_trimestre,
      v_numero_competencia,
      v_nombre_competencia,
      v_nombres_capacidades,
      v_user_id
    )
    on conflict (asignacion_docente_id, trimestre, numero_competencia)
    do update set
      nombre_competencia = excluded.nombre_competencia,
      nombres_capacidades = excluded.nombres_capacidades,
      actualizado_por = excluded.actualizado_por,
      updated_at = now();
  end loop;

  if p_estudiantes is null or pg_catalog.jsonb_typeof(p_estudiantes) <> 'array' then
    raise exception using errcode = '22023', message = 'Los estudiantes deben enviarse como un arreglo JSON.';
  end if;

  -- Validate roster ownership, four competency payloads per student and every
  -- capacity value before reconciling existing detail rows.
  for v_estudiante in
    select elemento.valor
    from pg_catalog.jsonb_array_elements(p_estudiantes) as elemento(valor)
  loop
    if pg_catalog.jsonb_typeof(v_estudiante) <> 'object' then
      raise exception using errcode = '22023', message = 'Cada estudiante debe ser un objeto JSON.';
    end if;

    begin
      v_estudiante_id := nullif(coalesce(
        v_estudiante ->> 'estudiante_id',
        v_estudiante ->> 'estudianteId'
      ), '')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'El identificador de estudiante no es válido.';
    end;

    if v_estudiante_id is null then
      raise exception using errcode = '22023', message = 'Cada fila debe incluir estudiante_id.';
    end if;

    if v_estudiante_id = any(v_estudiantes_ids) then
      raise exception using errcode = '22023', message = 'No se permiten estudiantes repetidos.';
    end if;
    v_estudiantes_ids := pg_catalog.array_append(v_estudiantes_ids, v_estudiante_id);

    if not exists (
      select 1
      from public.asignaciones_docente asignacion
      join public.cursos curso on curso.id = asignacion.curso_id and curso.activo
      join public.periodos periodo on periodo.id = asignacion.periodo_id
      join public.matriculas matricula
        on matricula.grado_id = curso.grado_id
       and matricula.gestion_id = periodo.gestion_id
       and matricula.estado = 'ACTIVA'::public.estado_matricula
      where asignacion.id = p_asignacion_id
        and asignacion.estado = 'ACTIVA'::public.estado_asignacion
        and matricula.estudiante_id = v_estudiante_id
    ) then
      raise exception using
        errcode = '42501',
        message = pg_catalog.format('El estudiante %s no pertenece a la asignación activa.', v_estudiante_id);
    end if;

    v_competencias_json := v_estudiante -> 'competencias';
    if v_competencias_json is null
      or pg_catalog.jsonb_typeof(v_competencias_json) <> 'array'
      or pg_catalog.jsonb_array_length(v_competencias_json) <> 4
    then
      raise exception using errcode = '22023', message = 'Cada estudiante debe incluir exactamente cuatro competencias.';
    end if;

    v_numeros_estudiante := array[]::integer[];
    for v_competencia_estudiante in
      select elemento.valor
      from pg_catalog.jsonb_array_elements(v_competencias_json) as elemento(valor)
    loop
      if pg_catalog.jsonb_typeof(v_competencia_estudiante) <> 'object' then
        raise exception using errcode = '22023', message = 'La competencia del estudiante debe ser un objeto JSON.';
      end if;

      begin
        v_numero_competencia := nullif(coalesce(
          v_competencia_estudiante ->> 'numero_competencia',
          v_competencia_estudiante ->> 'numeroCompetencia',
          v_competencia_estudiante ->> 'numero'
        ), '')::integer;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception using errcode = '22023', message = 'El número de competencia del estudiante no es válido.';
      end;

      if v_numero_competencia is null or v_numero_competencia not between 1 and 4 then
        raise exception using errcode = '22023', message = 'El número de competencia debe estar entre 1 y 4.';
      end if;
      if v_numero_competencia = any(v_numeros_estudiante) then
        raise exception using errcode = '22023', message = 'El estudiante contiene una competencia repetida.';
      end if;
      v_numeros_estudiante := pg_catalog.array_append(v_numeros_estudiante, v_numero_competencia);

      select pg_catalog.cardinality(configuracion.nombres_capacidades)
      into v_capacidades_esperadas
      from public.configuracion_competencias_docente configuracion
      where configuracion.asignacion_docente_id = p_asignacion_id
        and configuracion.trimestre = p_trimestre
        and configuracion.numero_competencia = v_numero_competencia;

      if not found then
        raise exception using errcode = 'P0002', message = 'No se encontró la configuración de competencia.';
      end if;

      v_notas_json := coalesce(
        v_competencia_estudiante -> 'notas',
        v_competencia_estudiante -> 'valores'
      );
      if v_notas_json is null or pg_catalog.jsonb_typeof(v_notas_json) <> 'array' then
        raise exception using errcode = '22023', message = 'Las notas de cada competencia deben ser un arreglo JSON.';
      end if;
      if pg_catalog.jsonb_array_length(v_notas_json) <> v_capacidades_esperadas then
        raise exception using
          errcode = '22023',
          message = pg_catalog.format(
            'La competencia %s requiere exactamente %s capacidades.',
            v_numero_competencia,
            v_capacidades_esperadas
          );
      end if;

      for v_nota, v_numero_capacidad in
        select nota.valor, nota.orden::integer
        from pg_catalog.jsonb_array_elements(v_notas_json)
          with ordinality as nota(valor, orden)
      loop
        if v_numero_capacidad > v_capacidades_esperadas then
          raise exception using errcode = '22023', message = 'La capacidad excede el límite configurado.';
        end if;

        if pg_catalog.jsonb_typeof(v_nota) = 'null' then
          continue;
        end if;
        if pg_catalog.jsonb_typeof(v_nota) <> 'number' then
          raise exception using errcode = '22023', message = 'Cada nota debe ser numérica o null.';
        end if;

        v_valor := (v_nota #>> '{}')::numeric;
        if v_valor < 0 or v_valor > 20 then
          raise exception using errcode = '22023', message = 'Cada nota debe estar entre 0 y 20.';
        end if;
      end loop;
    end loop;

    select pg_catalog.array_agg(numero order by numero)
    into v_numeros_estudiante
    from pg_catalog.unnest(v_numeros_estudiante) as numero;
    if v_numeros_estudiante <> array[1, 2, 3, 4]::integer[] then
      raise exception using errcode = '22023', message = 'Cada estudiante debe contener las competencias 1, 2, 3 y 4.';
    end if;
  end loop;

  -- A renamed or shortened configuration applies to all existing rows for the
  -- same assignment/trimestre. Removed capacity slots are real deletions.
  update public.calificacion_detalle_trimestre detalle
  set nombre_competencia = configuracion.nombre_competencia,
      nombre_nota = configuracion.nombres_capacidades[detalle.numero_capacidad]
  from public.configuracion_competencias_docente configuracion
  where configuracion.asignacion_docente_id = p_asignacion_id
    and configuracion.trimestre = p_trimestre
    and detalle.asignacion_docente_id = configuracion.asignacion_docente_id
    and detalle.trimestre = configuracion.trimestre
    and detalle.numero_competencia = configuracion.numero_competencia
    and detalle.numero_capacidad <= pg_catalog.cardinality(configuracion.nombres_capacidades)
    and (
      detalle.nombre_competencia is distinct from configuracion.nombre_competencia
      or detalle.nombre_nota is distinct from configuracion.nombres_capacidades[detalle.numero_capacidad]
    );

  delete from public.calificacion_detalle_trimestre detalle
  using public.configuracion_competencias_docente configuracion
  where configuracion.asignacion_docente_id = p_asignacion_id
    and configuracion.trimestre = p_trimestre
    and detalle.asignacion_docente_id = configuracion.asignacion_docente_id
    and detalle.trimestre = configuracion.trimestre
    and detalle.numero_competencia = configuracion.numero_competencia
    and detalle.numero_capacidad > pg_catalog.cardinality(configuracion.nombres_capacidades);
  get diagnostics v_detalles_eliminados = row_count;

  -- Submitted students are complete snapshots. Deleting their former details
  -- first makes null values and shortened/edited capacity sets deterministic.
  with estudiantes_enviados as (
    select coalesce(
      estudiante.valor ->> 'estudiante_id',
      estudiante.valor ->> 'estudianteId'
    )::uuid as estudiante_id
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
  )
  delete from public.calificacion_detalle_trimestre detalle
  using estudiantes_enviados enviado
  where detalle.estudiante_id = enviado.estudiante_id
    and detalle.asignacion_docente_id = p_asignacion_id
    and detalle.trimestre = p_trimestre;
  get diagnostics v_eliminados_actuales = row_count;
  v_detalles_eliminados := v_detalles_eliminados + v_eliminados_actuales;

  with detalle_payload as (
    select
      coalesce(
        estudiante.valor ->> 'estudiante_id',
        estudiante.valor ->> 'estudianteId'
      )::uuid as estudiante_id,
      coalesce(
        competencia.valor ->> 'numero_competencia',
        competencia.valor ->> 'numeroCompetencia',
        competencia.valor ->> 'numero'
      )::integer as numero_competencia,
      nota.orden::integer as numero_capacidad,
      nota.valor as valor
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
    cross join lateral pg_catalog.jsonb_array_elements(estudiante.valor -> 'competencias') as competencia(valor)
    cross join lateral pg_catalog.jsonb_array_elements(coalesce(
      competencia.valor -> 'notas',
      competencia.valor -> 'valores'
    )) with ordinality as nota(valor, orden)
  )
  insert into public.calificacion_detalle_trimestre (
    estudiante_id,
    asignacion_docente_id,
    importacion_id,
    trimestre,
    numero_competencia,
    nombre_competencia,
    numero_capacidad,
    columna_excel,
    nombre_nota,
    valor_nota,
    fila_excel
  )
  select
    detalle.estudiante_id,
    p_asignacion_id,
    null,
    p_trimestre,
    detalle.numero_competencia,
    configuracion.nombre_competencia,
    detalle.numero_capacidad,
    null,
    configuracion.nombres_capacidades[detalle.numero_capacidad],
    (detalle.valor #>> '{}')::numeric,
    null
  from detalle_payload detalle
  join public.configuracion_competencias_docente configuracion
    on configuracion.asignacion_docente_id = p_asignacion_id
   and configuracion.trimestre = p_trimestre
   and configuracion.numero_competencia = detalle.numero_competencia
  where pg_catalog.jsonb_typeof(detalle.valor) = 'number';
  get diagnostics v_detalles_guardados = row_count;

  -- Recalculate every student affected by this snapshot or by a global
  -- capacity reduction. Cross joining the four configurations persists empty
  -- competencies with a null average.
  with estudiantes_enviados as (
    select coalesce(
      estudiante.valor ->> 'estudiante_id',
      estudiante.valor ->> 'estudianteId'
    )::uuid as estudiante_id
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
  ),
  estudiantes_afectados as (
    select estudiante_id from estudiantes_enviados
    union
    select detalle.estudiante_id
    from public.calificacion_detalle_trimestre detalle
    where detalle.asignacion_docente_id = p_asignacion_id
      and detalle.trimestre = p_trimestre
    union
    select resumen.estudiante_id
    from public.calificacion_competencia_trimestre resumen
    where resumen.asignacion_docente_id = p_asignacion_id
      and resumen.trimestre = p_trimestre
  ),
  promedios as (
    select
      afectado.estudiante_id,
      configuracion.numero_competencia,
      configuracion.nombre_competencia,
      avg(detalle.valor_nota) filter (where detalle.valor_nota is not null) as promedio_competencia
    from estudiantes_afectados afectado
    cross join public.configuracion_competencias_docente configuracion
    left join public.calificacion_detalle_trimestre detalle
      on detalle.estudiante_id = afectado.estudiante_id
     and detalle.asignacion_docente_id = configuracion.asignacion_docente_id
     and detalle.trimestre = configuracion.trimestre
     and detalle.numero_competencia = configuracion.numero_competencia
    where configuracion.asignacion_docente_id = p_asignacion_id
      and configuracion.trimestre = p_trimestre
    group by
      afectado.estudiante_id,
      configuracion.numero_competencia,
      configuracion.nombre_competencia
  )
  insert into public.calificacion_competencia_trimestre (
    estudiante_id,
    asignacion_docente_id,
    importacion_id,
    trimestre,
    numero_competencia,
    nombre_competencia,
    promedio_competencia,
    logro_literal
  )
  select
    promedio.estudiante_id,
    p_asignacion_id,
    null,
    p_trimestre,
    promedio.numero_competencia,
    promedio.nombre_competencia,
    promedio.promedio_competencia,
    case
      when promedio.promedio_competencia is null then null
      when promedio.promedio_competencia <= 10 then 'C'
      when promedio.promedio_competencia <= 14 then 'B'
      when promedio.promedio_competencia <= 19 then 'A'
      else 'AD'
    end
  from promedios promedio
  on conflict (estudiante_id, asignacion_docente_id, trimestre, numero_competencia)
  do update set
    nombre_competencia = excluded.nombre_competencia,
    promedio_competencia = excluded.promedio_competencia,
    logro_literal = excluded.logro_literal,
    updated_at = now();
  get diagnostics v_competencias_guardadas = row_count;

  -- Rows explicitly submitted through the manual RPC no longer claim an Excel
  -- import as their source. Unsubmitted imported summaries retain provenance.
  with estudiantes_enviados as (
    select coalesce(
      estudiante.valor ->> 'estudiante_id',
      estudiante.valor ->> 'estudianteId'
    )::uuid as estudiante_id
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
  )
  update public.calificacion_competencia_trimestre resumen
  set importacion_id = null
  from estudiantes_enviados enviado
  where resumen.estudiante_id = enviado.estudiante_id
    and resumen.asignacion_docente_id = p_asignacion_id
    and resumen.trimestre = p_trimestre
    and resumen.importacion_id is not null;

  with estudiantes_afectados as (
    select coalesce(
      estudiante.valor ->> 'estudiante_id',
      estudiante.valor ->> 'estudianteId'
    )::uuid as estudiante_id
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
    union
    select detalle.estudiante_id
    from public.calificacion_detalle_trimestre detalle
    where detalle.asignacion_docente_id = p_asignacion_id
      and detalle.trimestre = p_trimestre
    union
    select resumen.estudiante_id
    from public.calificacion_competencia_trimestre resumen
    where resumen.asignacion_docente_id = p_asignacion_id
      and resumen.trimestre = p_trimestre
  ),
  promedios_finales as (
    select
      afectado.estudiante_id,
      avg(resumen.promedio_competencia)
        filter (where resumen.promedio_competencia is not null) as promedio_final
    from estudiantes_afectados afectado
    left join public.calificacion_competencia_trimestre resumen
      on resumen.estudiante_id = afectado.estudiante_id
     and resumen.asignacion_docente_id = p_asignacion_id
     and resumen.trimestre = p_trimestre
    group by afectado.estudiante_id
  )
  delete from public.notas nota
  using promedios_finales promedio
  where nota.estudiante_id = promedio.estudiante_id
    and nota.asignacion_docente_id = p_asignacion_id
    and nota.trimestre = p_trimestre
    and nota.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
    and promedio.promedio_final is null;
  get diagnostics v_finales_eliminados = row_count;

  with estudiantes_afectados as (
    select coalesce(
      estudiante.valor ->> 'estudiante_id',
      estudiante.valor ->> 'estudianteId'
    )::uuid as estudiante_id
    from pg_catalog.jsonb_array_elements(p_estudiantes) as estudiante(valor)
    union
    select detalle.estudiante_id
    from public.calificacion_detalle_trimestre detalle
    where detalle.asignacion_docente_id = p_asignacion_id
      and detalle.trimestre = p_trimestre
    union
    select resumen.estudiante_id
    from public.calificacion_competencia_trimestre resumen
    where resumen.asignacion_docente_id = p_asignacion_id
      and resumen.trimestre = p_trimestre
  ),
  promedios_finales as (
    select
      afectado.estudiante_id,
      avg(resumen.promedio_competencia)
        filter (where resumen.promedio_competencia is not null) as promedio_final
    from estudiantes_afectados afectado
    left join public.calificacion_competencia_trimestre resumen
      on resumen.estudiante_id = afectado.estudiante_id
     and resumen.asignacion_docente_id = p_asignacion_id
     and resumen.trimestre = p_trimestre
    group by afectado.estudiante_id
  )
  insert into public.notas (
    estudiante_id,
    asignacion_docente_id,
    trimestre,
    tipo,
    valor,
    logro_literal,
    publicado,
    observacion,
    importacion_id,
    registrado_por
  )
  select
    promedio.estudiante_id,
    p_asignacion_id,
    p_trimestre,
    'PROMEDIO_FINAL'::public.tipo_nota,
    promedio.promedio_final,
    case
      when promedio.promedio_final <= 10 then 'C'
      when promedio.promedio_final <= 14 then 'B'
      when promedio.promedio_final <= 19 then 'A'
      else 'AD'
    end,
    true,
    'Promedio final calculado desde competencias',
    null,
    v_user_id
  from promedios_finales promedio
  where promedio.promedio_final is not null
  on conflict (estudiante_id, asignacion_docente_id, trimestre, tipo)
  do update set
    valor = excluded.valor,
    logro_literal = excluded.logro_literal,
    publicado = excluded.publicado,
    observacion = excluded.observacion,
    importacion_id = null,
    registrado_por = excluded.registrado_por,
    updated_at = now();
  get diagnostics v_finales_guardados = row_count;

  return pg_catalog.jsonb_build_object(
    'message', 'Notas por competencias guardadas correctamente.',
    'asignacionId', p_asignacion_id,
    'trimestre', p_trimestre,
    'configuracionesGuardadas', 4,
    'estudiantesProcesados', pg_catalog.jsonb_array_length(p_estudiantes),
    'detallesGuardados', v_detalles_guardados,
    'detallesEliminados', v_detalles_eliminados,
    'competenciasRecalculadas', v_competencias_guardadas,
    'promediosFinalesGuardados', v_finales_guardados,
    'promediosFinalesEliminados', v_finales_eliminados
  );
end;
$$;

revoke all on function public.guardar_notas_competencias(uuid, public.trimestre, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.guardar_notas_competencias(uuid, public.trimestre, jsonb, jsonb)
  to authenticated;

comment on function public.guardar_notas_competencias(uuid, public.trimestre, jsonb, jsonb) is
  'Guarda configuración y notas de cuatro competencias de forma atómica; valida propietario docente/admin, matrícula, capacidades y rango 0..20.';
