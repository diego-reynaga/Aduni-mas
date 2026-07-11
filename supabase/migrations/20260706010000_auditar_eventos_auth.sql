drop policy if exists auditoria_insert_own on public.auditoria;

create policy auditoria_insert_own on public.auditoria
  for insert to authenticated
  with check (usuario_id = auth.uid());

grant insert on public.auditoria to authenticated;

create or replace function public.registrar_intento_login_fallido(
  p_email text,
  p_detalle jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auditoria(usuario_id, accion, entidad, entidad_id, usuario_responsable, detalle)
  values (
    null,
    'LOGIN_FALLIDO',
    'auth',
    null,
    split_part(p_email, '@', 1),
    jsonb_build_object('email', p_email) || p_detalle
  );
end;
$$;

grant execute on function public.registrar_intento_login_fallido(text, jsonb) to public, anon;
