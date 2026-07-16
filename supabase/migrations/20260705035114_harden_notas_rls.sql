-- PostgreSQL combines permissive RLS policies with OR. Remove the policies from
-- the initial schema so every teacher write also requires an active assignment
-- and an active enrollment in the assignment's grade and school year.
drop policy if exists notas_docente_insert on public.notas;
drop policy if exists notas_docente_update on public.notas;
