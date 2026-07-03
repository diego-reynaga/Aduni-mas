# Aduni+ Backend

Backend inicial para el Sistema de Gestión de Estudiantes Aduni+.

## Stack
- Java 21
- Maven
- Spring Boot 3.5.14
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Validation
- Lombok
- Apache POI para importación Excel

## Requisitos
```bash
java -version
mvn -version
```

## Base de datos
Crear la base de datos:

```sql
CREATE DATABASE aduniplus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Editar credenciales en:

```text
src/main/resources/application.yml
```

El esquema limpio auditable esta en `../../database/schema_aduniplus_limpio.sql`. Para desarrollo puede reiniciarse con `../../database/reset_database.sql`, siempre despues de ejecutar `../../database/backup_aduniplus.ps1`.

El esquema relacional tambien se mantiene alineado con las entidades JPA. Modelo principal:

- `persona` usa herencia JOINED hacia `docente`, `estudiante` y `apoderado`.
- `usuario`, `rol` y `usuario_rol` controlan el acceso por perfil para Angular.
- `gestion_academica -> nivel_educativo -> aula -> curso` organiza la estructura academica.
- `asignatura` funciona como catalogo reutilizable para los cursos.
- `matricula` y `detallematricula` separan la matricula del estudiante del detalle por asignatura.
- `asignaciondocente` controla que un docente solo registre notas de cursos asignados.
- `calificacion`, `evaluacion`, `nota` y `promedio_academico` soportan registro manual, consulta y compatibilidad con pantallas actuales.
- `importacion_excel` depende de `asignaciondocente`; `nota` depende de `evaluacion`; `detallematricula` depende de `asignatura`. Asi no hay dos rutas de negocio hacia curso/docente/periodo.
- `error_importacion_excel`, `calificacion_detalle_trimestre` y `calificacion_competencia_trimestre` guardan `importacion_id` como trazabilidad simple, sin FK navegable hacia el lote.
- `apoderadoestudiante` conserva el vinculo padre/apoderado-estudiante.
- `auditoria` registra acciones criticas con usuario responsable.

Diccionario de datos:

```text
docs/diccionario-datos.md
```

## Ejecutar
```bash
mvn spring-boot:run
```

Probar:
```text
GET http://localhost:8080/api/health
```

## Angular 21
El CORS está configurado para:
```text
http://localhost:4200
```

## Endpoints iniciales
- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/notas`
- `POST /api/notas/importar-excel`

## Módulo de importación de notas Excel

Flujo trimestral:

- `POST /api/notas/importar-trimestre/preview`: recibe `multipart/form-data` con `file`, `trimestre` y `assignmentId` o `cursoId`; valida estructura y devuelve metadata, estudiantes, notas individuales, promedios de competencia, resumen estadístico y errores.
- `POST /api/notas/importar-trimestre/confirmar`: recibe nuevamente `file`, `trimestre` y `assignmentId` o `cursoId`; recalcula la previsualización y guarda solo el trimestre seleccionado.
- `GET /api/notas/importaciones`: historial de importaciones para administrador o docente autenticado.
- `GET /api/notas/importaciones/{id}`: detalle del lote.
- `GET /api/notas/importaciones/{id}/errores`: errores registrados del lote.

La importación usa Apache POI, no depende de rangos nombrados ni de fórmulas internas del Excel, y calcula los promedios desde los bloques de competencias de la hoja seleccionada. Las notas individuales se guardan en `calificacion_detalle_trimestre`, los promedios por competencia en `calificacion_competencia_trimestre`, el promedio final en `calificacion`, `nota` y `promedio_academico`, los errores por fila en `error_importacion_excel`, y el lote con sus metadatos en `importacion_excel`.

Prueba unitaria del parser:

```bash
mvn "-Dtest=RegistroNotasExcelParserTest,RegistroNotasTrimestreParserTest" test
```
