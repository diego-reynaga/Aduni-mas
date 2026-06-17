# Diccionario de datos limpio

Este diccionario resume el esquema fisico actual de `aduniplus`. El SQL fuente de verdad esta en:

```text
../../../database/schema_aduniplus_limpio.sql
```

## Identidad y acceso

| Tabla | Proposito | Llaves principales |
| --- | --- | --- |
| `persona` | Datos comunes de personas. | `id`, `numero_documento`, `correo_persona` |
| `docente` | Especializacion de persona docente. | PK/FK `persona_id`, `codigo_docente` |
| `estudiante` | Especializacion de persona estudiante. | PK/FK `persona_id`, `codigo_estudiante` |
| `apoderado` | Especializacion de persona apoderada. | PK/FK `persona_id` |
| `rol` | Catalogo de roles del sistema. | `id`, `nombre` |
| `usuario` | Cuenta de acceso vinculada a una persona. | `id`, `username`, FK `persona_id` |
| `usuario_rol` | Relacion N:M entre usuarios y roles. | PK `usuario_id`, `rol_id` |

## Estructura academica

| Tabla | Proposito | Llaves principales |
| --- | --- | --- |
| `gestion_academica` | Gestion por anio escolar. | `id`, `anio` |
| `nivel_educativo` | Nivel dentro de una gestion. | `id`, FK `gestion_academica_id` |
| `periodo_academico` | Periodos/trimestres de una gestion. | `id`, FK `gestion_academica_id`, `orden` |
| `aula` | Grado y seccion/paralelo. | `id`, FK `nivel_educativo_id` |
| `asignatura` | Catalogo de asignaturas. | `id`, `codigo`, `nombre` |
| `curso` | Contexto aula + asignatura. | `id`, FK `aula_id`, FK `asignatura_id` |
| `matricula` | Matricula de estudiante en aula. | `id`, FK `estudiante_id`, FK `aula_id` |
| `detallematricula` | Asignatura tomada por una matricula. | `id`, FK `matricula_id`, FK `asignatura_id` |
| `asignaciondocente` | Docente asignado a curso y periodo. | `id`, FK `docente_id`, FK `curso_id`, FK `periodo_academico_id` |

## Notas e importacion

| Tabla | Proposito | Llaves principales |
| --- | --- | --- |
| `evaluacion` | Evaluacion de un curso en un periodo. | `id`, FK `curso_id`, FK `periodo_academico_id` |
| `nota` | Nota de estudiante en una evaluacion. | `id`, FK `estudiante_id`, FK `evaluacion_id`, FK `registrado_por_id` |
| `promedio_academico` | Promedio por estudiante, curso y periodo. | `id`, FK `estudiante_id`, FK `curso_id`, FK `periodo_academico_id` |
| `calificacion` | Promedio final por detalle de matricula, periodo y trimestre. | `id`, FK `detalle_matricula_id`, FK `periodo_academico_id` |
| `importacion_excel` | Lote de carga Excel asociado a una asignacion docente. | `id`, FK `asignacion_docente_id`, FK `usuario_responsable_id` |
| `error_importacion_excel` | Errores de un lote de importacion. | `id`, `importacion_id` como trazabilidad |
| `calificacion_detalle_trimestre` | Notas individuales por competencia del Excel trimestral. | `id`, FK `detalle_matricula_id`, `importacion_id` como trazabilidad |
| `calificacion_competencia_trimestre` | Promedio por competencia del Excel trimestral. | `id`, FK `detalle_matricula_id`, `importacion_id` como trazabilidad |
| `auditoria` | Acciones criticas del sistema. | `id`, FK opcional `usuario_id` |
| `configuracion_institucional` | Datos generales de la institucion. | `id`, `codigo` |

## Rutas sin bucles

El modelo evita caminos alternativos hacia la misma tabla de negocio:

| Consulta | Ruta permitida |
| --- | --- |
| Curso de una nota | `nota -> evaluacion -> curso` |
| Asignatura de un detalle de matricula | `detallematricula -> asignatura` |
| Aula de un detalle de matricula | `detallematricula -> matricula -> aula` |
| Docente, curso o periodo de una importacion | `importacion_excel -> asignaciondocente -> docente/curso/periodo` |

Las columnas `importacion_id` guardadas en notas/calificaciones/errores son trazabilidad simple. No declaran FK hacia `importacion_excel`, asi no crean una segunda ruta relacional hacia docente, curso o periodo.
