# Modelo relacional limpio Aduni+

## Analisis aplicado

Se revisaron entidades JPA, repositorios, servicios, controladores y DTOs del backend Spring Boot. El backend real trabaja con paquetes `persona`, `usuario`, `academico`, `notas`, `notas.importacion`, `auditoria`, `portal`, `auth` y `security`.

Hallazgos principales:

- `Persona` ya usaba herencia `JOINED`, por lo que `Docente`, `Estudiante` y `PadreFamilia` podian compartir la misma PK/FK de persona.
- Habia listas inversas `@OneToMany` en entidades como `Docente`, `Estudiante`, `PadreFamilia`, `GestionAcademica`, `NivelEducativo`, `Grado`, `Curso`, `Evaluacion` e `ImportacionNotas`; esas colecciones no eran necesarias para persistencia ni usadas por servicios.
- Los controladores principales ya devuelven DTOs del paquete `portal`; `NotaController` fue cambiado para devolver `NotaResponseDTO`.
- `Administrativo` y `AdministrativoRepository` no estaban usados por ningun servicio/controlador actual.
- El modelo anterior no tenia una entidad explicita `DETALLEMATRICULA` ni una entidad `CALIFICACION` final por periodo/trimestre.

## Tablas conservadas o normalizadas

- `persona`: base de datos personales comunes.
- `docente`, `estudiante`, `apoderado`: tablas hijas con PK `persona_id`.
- `rol`, `usuario`, `usuario_rol`: autenticacion y autorizacion.
- `apoderadoestudiante`: vinculo entre apoderado y estudiante, sin relacion Persona-Persona directa.
- `gestion_academica`, `nivel_educativo`, `periodo_academico`: se conservan porque el backend las usa para periodos, niveles y trimestres.
- `aula`: reemplaza el nombre fisico anterior de grado/seccion.
- `asignatura`: reemplaza el nombre fisico anterior de materia.
- `curso`: se conserva como tabla tecnica necesaria para resolver aula + asignatura en el backend actual.
- `matricula` y `detallematricula`: matricula del estudiante y detalle por curso.
- `asignaciondocente`: docente asignado a curso y periodo.
- `evaluacion`, `nota`, `promedio_academico`: se conservan por compatibilidad con pantallas existentes.
- `calificacion`: promedio final por detalle de matricula, periodo y trimestre.
- `importacion_excel`, `error_importacion_excel`, `calificacion_detalle_trimestre`, `calificacion_competencia_trimestre`: trazabilidad y detalle de importacion trimestral.
- `auditoria`: acciones criticas.
- `configuracion_institucional`: se conserva porque el portal admin la usa.

## Tablas eliminadas o reemplazadas

- `administrativos`: eliminada del backend porque no estaba usada por ningun flujo actual.
- Nombres fisicos legacy reemplazados por el esquema limpio: `personas`, `usuarios`, `roles`, `docentes`, `estudiantes`, `padres_familia`, `estudiante_apoderados`, `grados`, `materias`, `matriculas`, `asignaciones_docente`, `evaluaciones`, `notas`, `promedios_academicos`, `importaciones_notas`, `auditorias`.

Estas tablas antiguas se eliminan al ejecutar `schema_aduniplus_limpio.sql` o `reset_database.sql` en desarrollo.

## Relaciones modificadas

- Se eliminaron relaciones inversas `@OneToMany` no necesarias para evitar ciclos JSON.
- Las relaciones persistentes quedan unidireccionales desde la entidad hija o transaccional hacia su padre.
- `Usuario.roles` queda `LAZY`; los servicios lo leen dentro de transacciones.
- `CalificacionDetalleTrimestre` y `CalificacionCompetenciaTrimestre` dependen ahora de `DetalleMatricula`, no de la combinacion redundante matricula + curso + periodo.
- `Calificacion` evita duplicados con `detalle_matricula_id + periodo_academico_id + trimestre`.

## Respaldo

El script de respaldo esta en:

```powershell
database/backup_aduniplus.ps1
```

Uso:

```powershell
powershell -ExecutionPolicy Bypass -File database/backup_aduniplus.ps1
```

Requiere `mysqldump` en el `PATH`. En esta maquina no se encontro `mysql`/`mysqldump` en el `PATH`, por eso no se ejecuto un respaldo real ni un `DROP` real durante la modificacion.

## Reinicio de base de datos

El reinicio destructivo de desarrollo esta en:

```sql
database/reset_database.sql
```

Uso sugerido desde la raiz del proyecto:

```powershell
mysql -u root -p < database/reset_database.sql
```

El esquema limpio completo esta en:

```sql
database/schema_aduniplus_limpio.sql
```

## Pruebas recomendadas

```powershell
cd aduni-plus-backend-springboot/aduni-plus-backend
mvn -DskipTests compile
mvn "-Dtest=RegistroNotasExcelParserTest,RegistroNotasTrimestreParserTest" test
```

Despues de cargar datos semilla, verificar:

- Login.
- Dashboard admin/docente.
- Listado de usuarios.
- Listado de niveles/aulas/asignaturas.
- Registro manual de notas.
- Importacion Excel por trimestre.
- Historial de importaciones.
- Portal estudiante.
- Portal padre de familia.
- Auditoria.
