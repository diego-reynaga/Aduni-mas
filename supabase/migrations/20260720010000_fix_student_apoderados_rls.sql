-- 1. Actualizar la función helper para permitir que un estudiante acceda a la Persona de su apoderado
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
    or exists (
      select 1 from public.padres_familia pf
      join public.estudiante_apoderados ea on ea.padre_familia_id = pf.id and ea.activo
      where pf.persona_id = p_persona_id
        and (select private.is_estudiante_owner(ea.estudiante_id))
    )
$$;

-- 2. Modificar la política RLS de padres_familia para dar permiso de lectura a sus estudiantes asociados
drop policy if exists padres_scoped_select on public.padres_familia;
create policy padres_scoped_select on public.padres_familia for select to authenticated
using (
  (select private.is_admin())
  or persona_id = (select private.current_persona_id())
  or exists (
    select 1 from public.estudiante_apoderados ea
    where ea.padre_familia_id = padres_familia.id
      and (select private.is_estudiante_owner(ea.estudiante_id))
      and ea.activo
  )
);
