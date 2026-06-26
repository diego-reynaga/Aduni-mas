-- Reinicio destructivo SOLO para entorno de desarrollo.
-- Antes de ejecutar este archivo, genere un respaldo:
--   powershell -ExecutionPolicy Bypass -File database/backup_aduniplus.ps1
--
-- Ejecucion sugerida:
--   mysql -u root -p < database/reset_database.sql

DROP DATABASE IF EXISTS aduniplus;
CREATE DATABASE aduniplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- El cliente mysql acepta SOURCE. Ejecute desde la raiz del proyecto.
SOURCE database/schema_aduniplus_limpio.sql;
