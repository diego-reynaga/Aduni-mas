-- 1. Eliminar la restricción UNIQUE estricta de la tabla estudiante_apoderados
alter table public.estudiante_apoderados
  drop constraint if exists estudiante_apoderados_estudiante_id_padre_familia_id_key;

-- 2. Crear un índice único parcial que solo aplique a registros activos
create unique index estudiante_apoderado_estudiante_padre_unique
  on public.estudiante_apoderados (estudiante_id, padre_familia_id)
  where activo;
