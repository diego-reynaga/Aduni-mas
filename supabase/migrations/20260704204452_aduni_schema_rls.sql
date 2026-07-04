-- Aduni+ progressive migration: PostgreSQL schema, authorization helpers and RLS.
-- Spring Boot remains in the repository during the transition.

create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum (
  'ADMINISTRADOR',
  'DOCENTE',
  'ESTUDIANTE',
  'PADRE_FAMILIA'
);

create type public.estado_asignacion as enum ('ACTIVA', 'CERRADA');
create type public.estado_matricula as enum (
  'PRE_MATRICULADA', 'ACTIVA', 'RETIRADA', 'SUSPENDIDA', 'FINALIZADA', 'ANULADA'
);
create type public.trimestre as enum ('I_TRIMESTRE', 'II_TRIMESTRE', 'III_TRIMESTRE', 'ANUAL');
create type public.tipo_nota as enum (
  'PRACTICA', 'EXAMEN', 'TAREA', 'PARTICIPACION', 'PROMEDIO_FINAL'
);
create type public.estado_importacion as enum ('PENDIENTE', 'PROCESADA', 'OBSERVADA', 'FALLIDA');

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  nombres text not null check (char_length(trim(nombres)) between 1 and 100),
  apellidos text not null check (char_length(trim(apellidos)) between 1 and 120),
  tipo_documento text not null default 'DNI' check (char_length(tipo_documento) <= 20),
  numero_documento text not null unique check (char_length(numero_documento) <= 30),
  fecha_nacimiento date,
  genero text check (genero is null or char_length(genero) <= 20),
  direccion text check (direccion is null or char_length(direccion) <= 200),
  telefono text check (telefono is null or char_length(telefono) <= 30),
  correo text check (correo is null or char_length(correo) <= 150),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index personas_correo_unique
  on public.personas (lower(correo)) where correo is not null;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  persona_id uuid not null unique references public.personas(id) on delete restrict,
  rol public.app_role not null,
  username text not null unique check (char_length(username) between 3 and 150),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_unique on public.profiles (lower(username));

create table public.docentes (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null unique references public.personas(id) on delete cascade,
  codigo text not null unique check (char_length(codigo) <= 30),
  especialidad text check (especialidad is null or char_length(especialidad) <= 100),
  area_academica text check (area_academica is null or char_length(area_academica) <= 100),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null unique references public.personas(id) on delete cascade,
  codigo text not null unique check (char_length(codigo) <= 30),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.padres_familia (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null unique references public.personas(id) on delete cascade,
  ocupacion text check (ocupacion is null or char_length(ocupacion) <= 100),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.administrativos (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null unique references public.personas(id) on delete cascade,
  codigo text not null unique check (char_length(codigo) <= 30),
  cargo text not null check (char_length(cargo) <= 80),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estudiante_apoderados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  padre_familia_id uuid not null references public.padres_familia(id) on delete cascade,
  parentesco text not null check (char_length(parentesco) <= 40),
  principal boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, padre_familia_id)
);

create unique index estudiante_apoderado_principal_unique
  on public.estudiante_apoderados (estudiante_id)
  where principal and activo;

create table public.gestiones (
  id uuid primary key default gen_random_uuid(),
  anio integer not null unique check (anio between 2000 and 2100),
  nombre text not null check (char_length(nombre) <= 80),
  fecha_inicio date,
  fecha_fin date,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_inicio is null or fecha_fin is null or fecha_inicio <= fecha_fin)
);

create table public.niveles (
  id uuid primary key default gen_random_uuid(),
  gestion_id uuid not null references public.gestiones(id) on delete restrict,
  nombre text not null check (char_length(nombre) <= 80),
  turno text not null default 'MANANA' check (turno in ('MANANA', 'TARDE', 'NOCHE')),
  descripcion text check (descripcion is null or char_length(descripcion) <= 250),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gestion_id, nombre, turno)
);

create table public.grados (
  id uuid primary key default gen_random_uuid(),
  nivel_id uuid not null references public.niveles(id) on delete restrict,
  nombre text not null check (char_length(nombre) <= 80),
  paralelo text not null default 'A' check (char_length(paralelo) <= 20),
  capacidad integer not null default 30 check (capacidad between 1 and 200),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nivel_id, nombre, paralelo)
);

create table public.materias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (char_length(codigo) <= 20),
  nombre text not null check (char_length(nombre) <= 100),
  area text check (area is null or char_length(area) <= 80),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  grado_id uuid not null references public.grados(id) on delete restrict,
  materia_id uuid not null references public.materias(id) on delete restrict,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grado_id, materia_id)
);

create table public.periodos (
  id uuid primary key default gen_random_uuid(),
  gestion_id uuid not null references public.gestiones(id) on delete restrict,
  nombre text not null check (char_length(nombre) <= 80),
  orden integer not null check (orden between 1 and 20),
  fecha_inicio date,
  fecha_fin date,
  cerrado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gestion_id, orden),
  check (fecha_inicio is null or fecha_fin is null or fecha_inicio <= fecha_fin)
);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (char_length(codigo) <= 30),
  estudiante_id uuid not null references public.estudiantes(id) on delete restrict,
  grado_id uuid not null references public.grados(id) on delete restrict,
  gestion_id uuid not null references public.gestiones(id) on delete restrict,
  fecha_matricula date not null default current_date,
  estado public.estado_matricula not null default 'ACTIVA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, gestion_id)
);

create table public.asignaciones_docente (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.docentes(id) on delete restrict,
  curso_id uuid not null references public.cursos(id) on delete restrict,
  periodo_id uuid not null references public.periodos(id) on delete restrict,
  fecha_asignacion date not null default current_date,
  estado public.estado_asignacion not null default 'ACTIVA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (docente_id, curso_id, periodo_id)
);

create table public.importaciones_notas (
  id uuid primary key default gen_random_uuid(),
  asignacion_docente_id uuid not null references public.asignaciones_docente(id) on delete restrict,
  usuario_id uuid not null references public.profiles(id) on delete restrict,
  nombre_archivo text not null check (char_length(nombre_archivo) <= 180),
  hash_archivo text check (hash_archivo is null or char_length(hash_archivo) <= 128),
  trimestre public.trimestre not null,
  anio integer,
  nivel text,
  institucion text,
  lugar text,
  area_curricular text,
  docente_excel text,
  grado text,
  seccion text,
  total_registros integer not null default 0 check (total_registros between 0 and 100),
  registros_validos integer not null default 0 check (registros_validos between 0 and 100),
  registros_observados integer not null default 0 check (registros_observados between 0 and 100),
  estado public.estado_importacion not null default 'PENDIENTE',
  confirmada boolean not null default false,
  detalle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.errores_importacion_notas (
  id uuid primary key default gen_random_uuid(),
  importacion_id uuid not null references public.importaciones_notas(id) on delete cascade,
  fila_excel integer,
  estudiante_texto text check (estudiante_texto is null or char_length(estudiante_texto) <= 180),
  campo text check (campo is null or char_length(campo) <= 80),
  descripcion text not null check (char_length(descripcion) <= 500),
  critico boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete restrict,
  asignacion_docente_id uuid not null references public.asignaciones_docente(id) on delete restrict,
  trimestre public.trimestre not null,
  tipo public.tipo_nota not null,
  valor numeric(5,2) not null check (valor between 0 and 20),
  logro_literal text check (logro_literal is null or logro_literal in ('C', 'B', 'A', 'AD')),
  publicado boolean not null default false,
  observacion text check (observacion is null or char_length(observacion) <= 250),
  importacion_id uuid references public.importaciones_notas(id) on delete set null,
  registrado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, asignacion_docente_id, trimestre, tipo)
);

create table public.calificacion_detalle_trimestre (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete restrict,
  asignacion_docente_id uuid not null references public.asignaciones_docente(id) on delete restrict,
  importacion_id uuid not null references public.importaciones_notas(id) on delete cascade,
  trimestre public.trimestre not null check (trimestre <> 'ANUAL'),
  numero_competencia integer not null check (numero_competencia between 1 and 4),
  nombre_competencia text not null check (char_length(nombre_competencia) <= 255),
  columna_excel text not null check (char_length(columna_excel) <= 5),
  nombre_nota text not null check (char_length(nombre_nota) <= 100),
  valor_nota numeric(5,2) check (valor_nota is null or valor_nota between 0 and 20),
  fila_excel integer not null check (fila_excel between 17 and 116),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, asignacion_docente_id, trimestre, numero_competencia, columna_excel)
);

create table public.calificacion_competencia_trimestre (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete restrict,
  asignacion_docente_id uuid not null references public.asignaciones_docente(id) on delete restrict,
  importacion_id uuid not null references public.importaciones_notas(id) on delete cascade,
  trimestre public.trimestre not null check (trimestre <> 'ANUAL'),
  numero_competencia integer not null check (numero_competencia between 1 and 4),
  nombre_competencia text not null check (char_length(nombre_competencia) <= 255),
  promedio_competencia numeric(5,2) check (promedio_competencia is null or promedio_competencia between 0 and 20),
  logro_literal text check (logro_literal is null or logro_literal in ('C', 'B', 'A', 'AD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, asignacion_docente_id, trimestre, numero_competencia)
);

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  accion text not null check (char_length(accion) <= 80),
  entidad text not null check (char_length(entidad) <= 80),
  entidad_id uuid,
  usuario_responsable text not null default 'sistema' check (char_length(usuario_responsable) <= 150),
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.configuracion_institucional (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default 'PRINCIPAL',
  nombre text not null default 'Aduni+',
  logo_url text,
  direccion text,
  telefono text,
  correo_institucional text,
  ruc text,
  sitio_web text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index every foreign key and every predicate used frequently by RLS.
create index profiles_persona_idx on public.profiles(persona_id);
create index docentes_persona_idx on public.docentes(persona_id);
create index estudiantes_persona_idx on public.estudiantes(persona_id);
create index padres_persona_idx on public.padres_familia(persona_id);
create index administrativos_persona_idx on public.administrativos(persona_id);
create index apoderados_estudiante_idx on public.estudiante_apoderados(estudiante_id) where activo;
create index apoderados_padre_idx on public.estudiante_apoderados(padre_familia_id) where activo;
create index niveles_gestion_idx on public.niveles(gestion_id);
create index grados_nivel_idx on public.grados(nivel_id);
create index cursos_grado_idx on public.cursos(grado_id);
create index cursos_materia_idx on public.cursos(materia_id);
create index periodos_gestion_idx on public.periodos(gestion_id);
create index matriculas_estudiante_idx on public.matriculas(estudiante_id);
create index matriculas_grado_gestion_idx on public.matriculas(grado_id, gestion_id) where estado = 'ACTIVA';
create index asignaciones_docente_idx on public.asignaciones_docente(docente_id) where estado = 'ACTIVA';
create index asignaciones_curso_periodo_idx on public.asignaciones_docente(curso_id, periodo_id);
create index notas_estudiante_publicadas_idx on public.notas(estudiante_id, publicado);
create index notas_asignacion_idx on public.notas(asignacion_docente_id);
create index importaciones_asignacion_idx on public.importaciones_notas(asignacion_docente_id, created_at desc);
create index errores_importacion_idx on public.errores_importacion_notas(importacion_id);
create index detalle_estudiante_asignacion_idx on public.calificacion_detalle_trimestre(estudiante_id, asignacion_docente_id);
create index competencia_estudiante_asignacion_idx on public.calificacion_competencia_trimestre(estudiante_id, asignacion_docente_id);
create index auditoria_created_idx on public.auditoria(created_at desc);
create index auditoria_usuario_idx on public.auditoria(usuario_id);

-- RLS helper functions live outside exposed schemas. They deliberately use
-- SECURITY DEFINER to avoid recursive policies, have an empty search_path,
-- reject anonymous users, and are executable only by authenticated requests.
create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.profiles p
  where p.id = (select auth.uid())
    and p.activo
$$;

create or replace function private.current_persona_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.persona_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.activo
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and coalesce((select private.current_user_role()) = 'ADMINISTRADOR'::public.app_role, false)
$$;

create or replace function private.is_docente_asignado(p_curso_id uuid, p_periodo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.profiles p
    join public.docentes d on d.persona_id = p.persona_id and d.activo
    join public.asignaciones_docente a on a.docente_id = d.id
    where p.id = (select auth.uid())
      and p.activo
      and p.rol = 'DOCENTE'::public.app_role
      and a.curso_id = p_curso_id
      and a.periodo_id = p_periodo_id
      and a.estado = 'ACTIVA'::public.estado_asignacion
  )
$$;

create or replace function private.is_estudiante_owner(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.profiles p
    join public.estudiantes e on e.persona_id = p.persona_id and e.activo
    where p.id = (select auth.uid())
      and p.activo
      and p.rol = 'ESTUDIANTE'::public.app_role
      and e.id = p_estudiante_id
  )
$$;

create or replace function private.is_padre_de_estudiante(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.profiles p
    join public.padres_familia pf on pf.persona_id = p.persona_id and pf.activo
    join public.estudiante_apoderados ea on ea.padre_familia_id = pf.id and ea.activo
    where p.id = (select auth.uid())
      and p.activo
      and p.rol = 'PADRE_FAMILIA'::public.app_role
      and ea.estudiante_id = p_estudiante_id
  )
$$;

create or replace function private.is_docente_de_estudiante(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.profiles p
    join public.docentes d on d.persona_id = p.persona_id and d.activo
    join public.asignaciones_docente a on a.docente_id = d.id and a.estado = 'ACTIVA'
    join public.cursos c on c.id = a.curso_id
    join public.periodos pe on pe.id = a.periodo_id
    join public.matriculas m on m.grado_id = c.grado_id
      and m.gestion_id = pe.gestion_id
      and m.estado = 'ACTIVA'
    where p.id = (select auth.uid())
      and p.activo
      and m.estudiante_id = p_estudiante_id
  )
$$;

create or replace function private.can_access_estudiante(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_admin()), false)
    or coalesce((select private.is_estudiante_owner(p_estudiante_id)), false)
    or coalesce((select private.is_padre_de_estudiante(p_estudiante_id)), false)
    or coalesce((select private.is_docente_de_estudiante(p_estudiante_id)), false)
$$;

create or replace function private.can_access_persona(p_persona_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_admin()), false)
    or p_persona_id = (select private.current_persona_id())
    or exists (
      select 1 from public.estudiantes e
      where e.persona_id = p_persona_id
        and (select private.can_access_estudiante(e.id))
    )
$$;

create or replace function private.can_access_curso(p_curso_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_admin()), false)
  or exists (
    select 1
    from public.asignaciones_docente a
    where a.curso_id = p_curso_id
      and (select private.is_docente_asignado(a.curso_id, a.periodo_id))
  )
  or exists (
    select 1
    from public.asignaciones_docente a
    join public.periodos pe on pe.id = a.periodo_id
    join public.cursos c on c.id = a.curso_id
    join public.matriculas m on m.grado_id = c.grado_id
      and m.gestion_id = pe.gestion_id
      and m.estado = 'ACTIVA'
    where a.curso_id = p_curso_id
      and (
        (select private.is_docente_asignado(a.curso_id, a.periodo_id))
        or (select private.is_estudiante_owner(m.estudiante_id))
        or (select private.is_padre_de_estudiante(m.estudiante_id))
      )
  )
$$;

create or replace function private.can_access_asignacion(p_asignacion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_admin()), false) or exists (
    select 1
    from public.asignaciones_docente a
    join public.cursos c on c.id = a.curso_id
    join public.periodos pe on pe.id = a.periodo_id
    left join public.matriculas m on m.grado_id = c.grado_id
      and m.gestion_id = pe.gestion_id
      and m.estado = 'ACTIVA'
    where a.id = p_asignacion_id
      and (
        (select private.is_docente_asignado(a.curso_id, a.periodo_id))
        or (m.estudiante_id is not null and (select private.is_estudiante_owner(m.estudiante_id)))
        or (m.estudiante_id is not null and (select private.is_padre_de_estudiante(m.estudiante_id)))
      )
  )
$$;

create or replace function private.can_access_importacion(p_importacion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_admin()), false) or exists (
    select 1 from public.importaciones_notas i
    where i.id = p_importacion_id
      and (select private.can_access_asignacion(i.asignacion_docente_id))
  )
$$;

revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_username text;
  v_row jsonb;
  v_entity_id uuid;
begin
  if v_user is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;
  begin
    v_entity_id := nullif(v_row ->> 'id', '')::uuid;
  exception when invalid_text_representation then
    v_entity_id := null;
  end;

  select p.username into v_username from public.profiles p where p.id = v_user;
  insert into public.auditoria(usuario_id, accion, entidad, entidad_id, usuario_responsable, detalle)
  values (v_user, tg_op, tg_table_name, v_entity_id, coalesce(v_username, 'usuario'),
    jsonb_build_object('operacion', tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'personas','profiles','docentes','estudiantes','padres_familia','administrativos','estudiante_apoderados',
    'gestiones','niveles','grados','materias','cursos','periodos','matriculas',
    'asignaciones_docente','importaciones_notas','notas','calificacion_detalle_trimestre',
    'calificacion_competencia_trimestre','configuracion_institucional'
  ] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function private.set_updated_at()', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.audit_row_change()', t, t);
  end loop;
end
$$;

-- RLS is mandatory for every public table.
alter table public.personas enable row level security;
alter table public.profiles enable row level security;
alter table public.docentes enable row level security;
alter table public.estudiantes enable row level security;
alter table public.padres_familia enable row level security;
alter table public.administrativos enable row level security;
alter table public.estudiante_apoderados enable row level security;
alter table public.gestiones enable row level security;
alter table public.niveles enable row level security;
alter table public.grados enable row level security;
alter table public.materias enable row level security;
alter table public.cursos enable row level security;
alter table public.periodos enable row level security;
alter table public.matriculas enable row level security;
alter table public.asignaciones_docente enable row level security;
alter table public.notas enable row level security;
alter table public.importaciones_notas enable row level security;
alter table public.errores_importacion_notas enable row level security;
alter table public.calificacion_detalle_trimestre enable row level security;
alter table public.calificacion_competencia_trimestre enable row level security;
alter table public.auditoria enable row level security;
alter table public.configuracion_institucional enable row level security;

-- Administrators can manage every row, but only while their profile is active.
do $$
declare
  t text;
begin
  foreach t in array array[
    'personas','profiles','docentes','estudiantes','padres_familia','administrativos','estudiante_apoderados',
    'gestiones','niveles','grados','materias','cursos','periodos','matriculas',
    'asignaciones_docente','notas','importaciones_notas','errores_importacion_notas',
    'calificacion_detalle_trimestre','calificacion_competencia_trimestre','auditoria',
    'configuracion_institucional'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      t || '_admin_all', t
    );
  end loop;
end
$$;

create policy profiles_own_select on public.profiles for select to authenticated
using ((select auth.uid()) = id and activo);

create policy personas_scoped_select on public.personas for select to authenticated
using ((select private.can_access_persona(id)));

create policy docentes_own_select on public.docentes for select to authenticated
using (persona_id = (select private.current_persona_id()));

create policy estudiantes_scoped_select on public.estudiantes for select to authenticated
using ((select private.can_access_estudiante(id)));

create policy padres_own_select on public.padres_familia for select to authenticated
using (persona_id = (select private.current_persona_id()));

create policy administrativos_own_select on public.administrativos for select to authenticated
using (persona_id = (select private.current_persona_id()));

create policy vinculos_scoped_select on public.estudiante_apoderados for select to authenticated
using (
  (select private.is_estudiante_owner(estudiante_id))
  or (select private.is_padre_de_estudiante(estudiante_id))
);

create policy gestiones_authenticated_select on public.gestiones for select to authenticated using (true);
create policy niveles_authenticated_select on public.niveles for select to authenticated using (true);
create policy grados_authenticated_select on public.grados for select to authenticated using (true);
create policy materias_authenticated_select on public.materias for select to authenticated using (true);
create policy periodos_authenticated_select on public.periodos for select to authenticated using (true);

create policy cursos_scoped_select on public.cursos for select to authenticated
using ((select private.can_access_curso(id)));

create policy matriculas_scoped_select on public.matriculas for select to authenticated
using ((select private.can_access_estudiante(estudiante_id)));

create policy asignaciones_scoped_select on public.asignaciones_docente for select to authenticated
using ((select private.can_access_asignacion(id)));

create policy notas_scoped_select on public.notas for select to authenticated
using (
  (select private.can_access_asignacion(asignacion_docente_id))
  and (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    or (
      publicado
      and (
        (select private.is_estudiante_owner(estudiante_id))
        or (select private.is_padre_de_estudiante(estudiante_id))
      )
    )
  )
);

create policy notas_docente_insert on public.notas for insert to authenticated
with check (
  registrado_por = (select auth.uid())
  and (select private.can_access_asignacion(asignacion_docente_id))
  and (select private.current_user_role()) = 'DOCENTE'::public.app_role
  and (select private.is_docente_de_estudiante(estudiante_id))
);

create policy notas_docente_update on public.notas for update to authenticated
using (
  (select private.can_access_asignacion(asignacion_docente_id))
  and (select private.current_user_role()) = 'DOCENTE'::public.app_role
)
with check (
  registrado_por = (select auth.uid())
  and (select private.can_access_asignacion(asignacion_docente_id))
  and (select private.current_user_role()) = 'DOCENTE'::public.app_role
  and (select private.is_docente_de_estudiante(estudiante_id))
);

create policy importaciones_docente_select on public.importaciones_notas for select to authenticated
using (
  usuario_id = (select auth.uid())
  and (select private.can_access_asignacion(asignacion_docente_id))
);

create policy errores_importacion_scoped_select on public.errores_importacion_notas for select to authenticated
using ((select private.can_access_importacion(importacion_id)));

create policy detalle_trimestre_scoped_select on public.calificacion_detalle_trimestre for select to authenticated
using (
  (select private.can_access_asignacion(asignacion_docente_id))
  and (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    or exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_detalle_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_detalle_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_detalle_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
        and (
          (select private.is_estudiante_owner(n.estudiante_id))
          or (select private.is_padre_de_estudiante(n.estudiante_id))
        )
    )
  )
);

create policy competencia_trimestre_scoped_select on public.calificacion_competencia_trimestre for select to authenticated
using (
  (select private.can_access_asignacion(asignacion_docente_id))
  and (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    or exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_competencia_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_competencia_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_competencia_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
        and (
          (select private.is_estudiante_owner(n.estudiante_id))
          or (select private.is_padre_de_estudiante(n.estudiante_id))
        )
    )
  )
);

create policy configuracion_authenticated_select on public.configuracion_institucional
for select to authenticated using (true);

-- Explicit Data API grants are required for projects created after May 2026.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.personas, public.docentes, public.estudiantes,
  public.padres_familia, public.administrativos, public.estudiante_apoderados, public.gestiones, public.niveles,
  public.grados, public.materias, public.cursos, public.periodos, public.matriculas,
  public.asignaciones_docente, public.notas, public.configuracion_institucional
to authenticated;
grant all on all tables in schema public to service_role;

insert into public.configuracion_institucional (codigo, nombre)
values ('PRINCIPAL', 'Aduni+');

comment on schema private is 'Funciones de autorización no expuestas por Data API.';
comment on table public.profiles is 'Extensión segura de auth.users; profiles.id siempre coincide con auth.users.id.';
comment on table public.importaciones_notas is 'Historial; los archivos Excel no se persisten en Storage.';
