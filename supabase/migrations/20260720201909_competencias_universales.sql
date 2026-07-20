-- Mathematics competency names are curricular constants shared by manual
-- entry, Excel imports and student/family reports. Keep them independent from
-- workbook labels and prevent later UI/RPC payloads from renaming them.
create or replace function private.nombre_competencia_universal(p_numero integer)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case p_numero
    when 1 then 'Resuelve problemas de cantidad'
    when 2 then 'Resuelve problemas de regularidad, equivalencia y cambio'
    when 3 then 'Resuelve problemas de forma, movimiento y localización'
    when 4 then 'Resuelve problemas de gestión de datos e incertidumbre'
    else pg_catalog.format('Competencia %s', p_numero)
  end
$$;

revoke all on function private.nombre_competencia_universal(integer) from public;

create or replace function private.forzar_nombre_competencia_universal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.nombre_competencia := private.nombre_competencia_universal(new.numero_competencia);
  return new;
end;
$$;

revoke all on function private.forzar_nombre_competencia_universal() from public;

drop trigger if exists configuracion_competencia_nombre_universal
  on public.configuracion_competencias_docente;
create trigger configuracion_competencia_nombre_universal
before insert or update of numero_competencia, nombre_competencia
on public.configuracion_competencias_docente
for each row execute function private.forzar_nombre_competencia_universal();

update public.configuracion_competencias_docente
set nombre_competencia = private.nombre_competencia_universal(numero_competencia)
where nombre_competencia is distinct from private.nombre_competencia_universal(numero_competencia);

update public.calificacion_detalle_trimestre
set nombre_competencia = private.nombre_competencia_universal(numero_competencia),
    updated_at = now()
where nombre_competencia is distinct from private.nombre_competencia_universal(numero_competencia);

update public.calificacion_competencia_trimestre
set nombre_competencia = private.nombre_competencia_universal(numero_competencia),
    updated_at = now()
where nombre_competencia is distinct from private.nombre_competencia_universal(numero_competencia);

comment on function private.nombre_competencia_universal(integer) is
  'Devuelve el nombre curricular invariable de cada una de las cuatro competencias de Matemática.';
