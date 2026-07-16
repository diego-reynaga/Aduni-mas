-- Create the bucket
insert into storage.buckets (id, name, public) 
values ('institucional', 'institucional', true)
on conflict (id) do nothing;

-- Public read access
create policy "Lectura publica de logos" 
on storage.objects for select 
to public 
using ( bucket_id = 'institucional' );

-- Authenticated upload access
create policy "Administradores pueden subir logos" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'institucional' );

-- Authenticated update access
create policy "Administradores pueden actualizar logos" 
on storage.objects for update 
to authenticated 
using ( bucket_id = 'institucional' );

-- Authenticated delete access
create policy "Administradores pueden borrar logos" 
on storage.objects for delete 
to authenticated 
using ( bucket_id = 'institucional' );
