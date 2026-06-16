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
CREATE DATABASE aduni_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Editar credenciales en:

```text
src/main/resources/application.yml
```

El esquema relacional se genera desde las entidades JPA con `spring.jpa.hibernate.ddl-auto=update`.
Modelo principal:

- `personas` usa herencia JOINED hacia `docentes`, `estudiantes`, `padres_familia` y `administrativos`.
- `usuarios`, `roles` y `usuario_roles` controlan el acceso por perfil para Angular 21.
- `gestiones_academicas -> niveles_educativos -> grados -> cursos` organiza la estructura academica.
- `materias` funciona como catalogo reutilizable para los cursos.
- `periodos_academicos`, `asignaciones_docente`, `matriculas` y `estudiante_apoderados` controlan permisos academicos, secciones y acceso familiar.
- `evaluaciones`, `notas`, `promedios_academicos` e `importaciones_notas` soportan registro manual, importacion Excel, consulta y trazabilidad.
- `configuraciones_institucionales` centraliza datos de la academia.
- `auditorias` registra acciones criticas con usuario responsable.

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

La importación usa Apache POI, no depende de rangos nombrados ni de fórmulas internas del Excel, y calcula los promedios desde los bloques de competencias de la hoja seleccionada. Las notas individuales se guardan en `calificacion_detalle_trimestre`, los promedios por competencia en `calificacion_competencia_trimestre`, los errores por fila en `error_importacion_excel`, y el lote con sus metadatos en `importaciones_notas`.

Prueba unitaria del parser:

```bash
mvn "-Dtest=RegistroNotasExcelParserTest,RegistroNotasTrimestreParserTest" test
```
