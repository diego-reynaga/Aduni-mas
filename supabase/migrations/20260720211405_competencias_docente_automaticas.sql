-- Every course assignment receives the same four Mathematics competencies for
-- each grading trimester. This also repairs assignments created before the
-- automatic seed trigger was available.
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
    private.nombre_competencia_universal(competencia.numero),
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

drop trigger if exists asignaciones_docente_seed_competencias
  on public.asignaciones_docente;
create trigger asignaciones_docente_seed_competencias
after insert on public.asignaciones_docente
for each row execute function private.seed_competencias_docente_asignacion();

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
  private.nombre_competencia_universal(competencia.numero),
  array['PRACTICA', 'EXAMEN', 'CUADERNO']::text[],
  null
from public.asignaciones_docente asignacion
cross join (
  values
    ('I_TRIMESTRE'::public.trimestre),
    ('II_TRIMESTRE'::public.trimestre),
    ('III_TRIMESTRE'::public.trimestre)
) as trimestre(valor)
cross join pg_catalog.generate_series(1, 4) as competencia(numero)
on conflict (asignacion_docente_id, trimestre, numero_competencia) do nothing;
