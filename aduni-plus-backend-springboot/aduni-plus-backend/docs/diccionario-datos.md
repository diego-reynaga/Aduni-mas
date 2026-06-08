# Diccionario de datos - Aduni+

Este diccionario describe el esquema relacional generado desde las entidades JPA del backend Spring Boot. La base de datos objetivo es MySQL con motor InnoDB y el esquema se actualiza mediante `spring.jpa.hibernate.ddl-auto=update`.

## Convenciones

- `PK`: llave primaria.
- `FK`: llave foranea.
- `UK`: restriccion unica.
- `NN`: campo obligatorio (`NOT NULL`).
- Todas las entidades que heredan de `BaseEntity` incluyen `id`, `creado_en` y `actualizado_en`.
- Tipos aproximados para MySQL: `Long -> BIGINT`, `String(length=N) -> VARCHAR(N)`, `Boolean -> BIT/TINYINT`, `LocalDate -> DATE`, `LocalDateTime -> DATETIME`, `BigDecimal(precision, scale) -> DECIMAL(precision, scale)`.
- En herencia `JOINED`, la tabla `personas` concentra los datos comunes y las tablas especializadas usan `persona_id` como `PK` y `FK`.

## Campos comunes de BaseEntity

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador interno del registro. |
| creado_en | DATETIME | NN, no actualizable | Fecha y hora de creacion. |
| actualizado_en | DATETIME |  | Fecha y hora de ultima actualizacion. |

## personas

Almacena los datos comunes de cualquier persona vinculada a la academia.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de persona. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| tipo_persona | VARCHAR(30) |  | Discriminador de herencia: `DOCENTE`, `ESTUDIANTE`, `PADRE_FAMILIA`, `ADMINISTRATIVO`. |
| nombres | VARCHAR(100) | NN | Nombres de la persona. |
| apellidos | VARCHAR(120) | NN | Apellidos de la persona. |
| documento_identidad | VARCHAR(20) | NN, UK `uk_personas_documento` | DNI u otro documento unico. |
| fecha_nacimiento | DATE |  | Fecha de nacimiento. |
| direccion | VARCHAR(150) |  | Direccion de residencia. |
| telefono | VARCHAR(20) |  | Telefono de contacto. |
| correo | VARCHAR(150) | UK `uk_personas_correo` | Correo personal o institucional. |

## docentes

Especializacion de `personas` para docentes.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| persona_id | BIGINT | PK, FK -> `personas.id`, NN | Identificador heredado de persona. |
| codigo_docente | VARCHAR(30) | NN, UK `uk_docentes_codigo` | Codigo institucional del docente. |
| especialidad | VARCHAR(100) |  | Especialidad profesional o academica. |
| area_academica | VARCHAR(100) |  | Area a la que pertenece el docente. |
| activo | BIT/TINYINT | NN, default `true` | Estado operativo del docente. |

## estudiantes

Especializacion de `personas` para estudiantes.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| persona_id | BIGINT | PK, FK -> `personas.id`, NN | Identificador heredado de persona. |
| codigo_estudiante | VARCHAR(30) | NN, UK `uk_estudiantes_codigo` | Codigo institucional del estudiante. |
| activo | BIT/TINYINT | NN, default `true` | Estado academico/operativo del estudiante. |

## padres_familia

Especializacion de `personas` para padres o apoderados.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| persona_id | BIGINT | PK, FK -> `personas.id`, NN | Identificador heredado de persona. |
| ocupacion | VARCHAR(100) |  | Ocupacion del padre o apoderado. |
| activo | BIT/TINYINT | NN, default `true` | Estado de acceso del padre o apoderado. |

## administrativos

Especializacion de `personas` para personal administrativo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| persona_id | BIGINT | PK, FK -> `personas.id`, NN | Identificador heredado de persona. |
| codigo_administrativo | VARCHAR(30) | NN, UK `uk_administrativos_codigo` | Codigo institucional del administrativo. |
| cargo | VARCHAR(80) | NN | Cargo o responsabilidad administrativa. |
| activo | BIT/TINYINT | NN, default `true` | Estado operativo del administrativo. |

## estudiante_apoderados

Relaciona estudiantes con padres o apoderados autorizados para consultar notas.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de la relacion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| estudiante_id | BIGINT | NN, FK -> `estudiantes.persona_id` | Estudiante asociado. |
| padre_familia_id | BIGINT | NN, FK -> `padres_familia.persona_id` | Padre o apoderado asociado. |
| parentesco | VARCHAR(40) | NN | Parentesco con el estudiante. |
| principal | BIT/TINYINT | NN, default `false` | Indica si es el apoderado principal. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_estudiante_apoderado` | `estudiante_id`, `padre_familia_id` | Evita duplicar la misma relacion estudiante-apoderado. |

## roles

Catalogo de roles del sistema.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador del rol. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| nombre | VARCHAR(30) | NN, UK `uk_roles_nombre` | Rol de acceso. |

Valores permitidos para `nombre`: `ADMINISTRADOR`, `DOCENTE`, `ESTUDIANTE`, `PADRE_FAMILIA`.

## usuarios

Almacena credenciales y estado de acceso. Cada usuario se asocia a una persona.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador del usuario. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| username | VARCHAR(80) | NN, UK `uk_usuarios_username` | Nombre de usuario para inicio de sesion. |
| password | VARCHAR(255) | NN | Contrasena cifrada. |
| activo | BIT/TINYINT | NN, default `true` | Indica si el usuario puede iniciar sesion. |
| persona_id | BIGINT | NN, FK -> `personas.id`, UK `uk_usuarios_persona` | Persona propietaria de la cuenta. |

## usuario_roles

Tabla intermedia para asignar uno o mas roles a cada usuario.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| usuario_id | BIGINT | NN, FK -> `usuarios.id` | Usuario asignado. |
| rol_id | BIGINT | NN, FK -> `roles.id` | Rol asignado. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_usuario_roles_usuario_rol` | `usuario_id`, `rol_id` | Evita duplicar el mismo rol para un usuario. |

## gestiones_academicas

Define el anio academico de trabajo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de gestion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| anio | INT | NN, UK `uk_gestiones_anio` | Anio academico. |
| nombre | VARCHAR(80) | NN | Nombre visible de la gestion. |
| fecha_inicio | DATE |  | Fecha de inicio. |
| fecha_fin | DATE |  | Fecha de fin. |
| activa | BIT/TINYINT | NN, default `true` | Indica si es la gestion activa. |

## niveles_educativos

Agrupa grados dentro de una gestion academica y turno.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de nivel. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| gestion_academica_id | BIGINT | NN, FK -> `gestiones_academicas.id` | Gestion academica propietaria. |
| nombre | VARCHAR(80) | NN | Nombre del nivel o programa. |
| turno | VARCHAR(20) | NN | Turno del nivel. |
| descripcion | VARCHAR(250) |  | Descripcion adicional. |
| activo | BIT/TINYINT | NN, default `true` | Estado del nivel. |

Valores permitidos para `turno`: `MANANA`, `TARDE`, `NOCHE`.

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_niveles_gestion_nombre_turno` | `gestion_academica_id`, `nombre`, `turno` | Evita duplicar niveles por gestion y turno. |

## grados

Representa grado, aula o paralelo dentro de un nivel educativo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de grado. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| nivel_educativo_id | BIGINT | NN, FK -> `niveles_educativos.id` | Nivel educativo asociado. |
| nombre | VARCHAR(80) | NN | Nombre del grado o grupo. |
| paralelo | VARCHAR(20) | NN | Paralelo o seccion. |
| activo | BIT/TINYINT | NN, default `true` | Estado del grado. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_grados_nivel_nombre_paralelo` | `nivel_educativo_id`, `nombre`, `paralelo` | Evita duplicar el mismo grado/paralelo en un nivel. |

## materias

Catalogo reutilizable de materias.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de materia. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| codigo | VARCHAR(20) | UK `uk_materias_codigo` | Codigo de materia. |
| nombre | VARCHAR(100) | NN, UK `uk_materias_nombre` | Nombre de la materia. |
| area | VARCHAR(20) |  | Area academica. |
| activa | BIT/TINYINT | NN, default `true` | Estado de la materia. |

## cursos

Asocia una materia a un grado especifico.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de curso. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| grado_id | BIGINT | NN, FK -> `grados.id` | Grado donde se dicta el curso. |
| materia_id | BIGINT | NN, FK -> `materias.id` | Materia impartida. |
| activo | BIT/TINYINT | NN, default `true` | Estado del curso. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_cursos_grado_materia` | `grado_id`, `materia_id` | Evita repetir una materia en el mismo grado. |

## periodos_academicos

Define bimestres, unidades, ciclos o periodos de evaluacion dentro de una gestion.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de periodo. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| gestion_academica_id | BIGINT | NN, FK -> `gestiones_academicas.id` | Gestion academica asociada. |
| nombre | VARCHAR(80) | NN | Nombre del periodo. |
| orden | INT | NN | Orden de presentacion/calculo. |
| fecha_inicio | DATE |  | Fecha inicial. |
| fecha_fin | DATE |  | Fecha final. |
| cerrado | BIT/TINYINT | NN, default `false` | Indica si el periodo ya fue cerrado. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_periodos_gestion_nombre` | `gestion_academica_id`, `nombre` | Evita duplicar nombres de periodo en la misma gestion. |
| `uk_periodos_gestion_orden` | `gestion_academica_id`, `orden` | Evita duplicar el orden del periodo en la misma gestion. |

## matriculas

Registra la matricula de un estudiante en un grado.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de matricula. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| codigo_matricula | VARCHAR(30) | NN, UK `uk_matriculas_codigo` | Codigo unico de matricula. |
| estudiante_id | BIGINT | NN, FK -> `estudiantes.persona_id`, INDEX `idx_matriculas_estudiante` | Estudiante matriculado. |
| grado_id | BIGINT | NN, FK -> `grados.id` | Grado asignado. |
| fecha_matricula | DATE | NN | Fecha de matricula. |
| estado | VARCHAR(20) | NN, default `ACTIVA` | Estado de matricula. |

Valores permitidos para `estado`: `ACTIVA`, `RETIRADA`, `FINALIZADA`, `ANULADA`.

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_matriculas_estudiante_grado` | `estudiante_id`, `grado_id` | Evita matricular dos veces al mismo estudiante en el mismo grado. |

## asignaciones_docente

Controla que cada docente gestione solo sus cursos asignados por periodo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de asignacion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| docente_id | BIGINT | NN, FK -> `docentes.persona_id`, INDEX `idx_asignaciones_docente` | Docente responsable. |
| curso_id | BIGINT | NN, FK -> `cursos.id`, INDEX `idx_asignaciones_curso` | Curso asignado. |
| periodo_academico_id | BIGINT | NN, FK -> `periodos_academicos.id` | Periodo de la asignacion. |
| fecha_asignacion | DATE |  | Fecha en que se asigno el curso. |
| estado | VARCHAR(20) | NN, default `ACTIVA` | Estado de la asignacion. |

Valores permitidos para `estado`: `ACTIVA`, `CERRADA`.

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_asignaciones_docente_curso_periodo` | `docente_id`, `curso_id`, `periodo_academico_id` | Evita duplicar la misma asignacion docente. |

## evaluaciones

Define los componentes evaluativos de un curso en un periodo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de evaluacion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| curso_id | BIGINT | NN, FK -> `cursos.id` | Curso evaluado. |
| periodo_academico_id | BIGINT | NN, FK -> `periodos_academicos.id` | Periodo de evaluacion. |
| nombre | VARCHAR(100) | NN | Nombre de la evaluacion. |
| tipo | VARCHAR(30) | NN, default `OTRO` | Tipo de evaluacion. |
| peso | DECIMAL(5,2) | NN, CHECK `peso >= 0 and peso <= 100` | Peso porcentual de la evaluacion. |
| orden | INT | NN | Orden de presentacion/calculo. |
| publicada | BIT/TINYINT | NN, default `false` | Indica si ya es visible para consulta. |

Valores permitidos para `tipo`: `PRACTICA`, `EXAMEN`, `TAREA`, `PARTICIPACION`, `OTRO`.

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_evaluaciones_curso_periodo_nombre` | `curso_id`, `periodo_academico_id`, `nombre` | Evita duplicar una evaluacion en el mismo curso y periodo. |

## notas

Registra la calificacion de un estudiante en una evaluacion.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de nota. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| estudiante_id | BIGINT | NN, FK -> `estudiantes.persona_id`, INDEX `idx_notas_estudiante` | Estudiante calificado. |
| evaluacion_id | BIGINT | NN, FK -> `evaluaciones.id`, INDEX `idx_notas_evaluacion` | Evaluacion calificada. |
| asignacion_docente_id | BIGINT | NN, FK -> `asignaciones_docente.id` | Asignacion que habilita al docente para registrar la nota. |
| registrado_por_id | BIGINT | NN, FK -> `usuarios.id` | Usuario que registro o modifico la nota. |
| importacion_notas_id | BIGINT | FK -> `importaciones_notas.id` | Lote de importacion Excel que origino la nota, si aplica. |
| valor | DECIMAL(5,2) | NN, CHECK `valor >= 0 and valor <= 20` | Calificacion numerica. |
| observacion | VARCHAR(250) |  | Observacion academica opcional. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_notas_estudiante_evaluacion` | `estudiante_id`, `evaluacion_id` | Evita mas de una nota por estudiante y evaluacion. |

## promedios_academicos

Almacena el promedio calculado de un estudiante por curso y periodo.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de promedio. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| estudiante_id | BIGINT | NN, FK -> `estudiantes.persona_id`, INDEX `idx_promedios_estudiante` | Estudiante asociado. |
| curso_id | BIGINT | NN, FK -> `cursos.id` | Curso promediado. |
| periodo_academico_id | BIGINT | NN, FK -> `periodos_academicos.id` | Periodo del promedio. |
| promedio | DECIMAL(5,2) | NN, CHECK `promedio >= 0 and promedio <= 20` | Promedio final calculado. |
| publicado | BIT/TINYINT | NN, default `false` | Indica si el promedio es visible para estudiante/padre. |
| calculado_en | DATETIME | NN | Fecha y hora del ultimo calculo. |

Restricciones:

| Restriccion | Columnas | Descripcion |
|---|---|---|
| `uk_promedios_estudiante_curso_periodo` | `estudiante_id`, `curso_id`, `periodo_academico_id` | Evita duplicar promedios para el mismo estudiante, curso y periodo. |

## importaciones_notas

Registra los lotes de carga de notas desde Excel.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de importacion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| docente_id | BIGINT | NN, FK -> `docentes.persona_id` | Docente responsable de la importacion. |
| curso_id | BIGINT | NN, FK -> `cursos.id` | Curso asociado al archivo. |
| periodo_academico_id | BIGINT | NN, FK -> `periodos_academicos.id` | Periodo asociado al archivo. |
| usuario_responsable_id | BIGINT | NN, FK -> `usuarios.id` | Usuario que ejecuto la importacion. |
| nombre_archivo | VARCHAR(180) | NN | Nombre del archivo Excel importado. |
| hash_archivo | VARCHAR(128) |  | Hash para trazabilidad del archivo. |
| total_registros | INT | NN, default `0` | Total de filas procesadas. |
| registros_validos | INT | NN, default `0` | Filas importadas correctamente. |
| registros_observados | INT | NN, default `0` | Filas con observaciones o errores. |
| estado | VARCHAR(30) | NN, default `PENDIENTE` | Estado del proceso de importacion. |
| detalle | TEXT |  | Detalle del resultado, errores o validaciones. |

Valores permitidos para `estado`: `PENDIENTE`, `PROCESADA`, `OBSERVADA`, `FALLIDA`.

## configuraciones_institucionales

Centraliza los datos generales de la academia.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de configuracion. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| codigo | VARCHAR(30) | NN, UK `uk_configuraciones_codigo`, default `PRINCIPAL` | Codigo de configuracion. |
| nombre | VARCHAR(150) | NN | Nombre de la academia. |
| logo_url | VARCHAR(250) |  | Ruta o URL del logo institucional. |
| direccion | VARCHAR(200) |  | Direccion institucional. |
| telefono | VARCHAR(30) |  | Telefono institucional. |
| correo_institucional | VARCHAR(150) |  | Correo institucional. |
| ruc | VARCHAR(20) |  | RUC u otro identificador fiscal. |
| sitio_web | VARCHAR(150) |  | Sitio web institucional. |

## auditorias

Registra acciones relevantes sobre datos academicos y administrativos.

| Campo | Tipo MySQL | Restricciones | Descripcion |
|---|---:|---|---|
| id | BIGINT | PK, NN, AUTO_INCREMENT | Identificador de auditoria. |
| creado_en | DATETIME | NN | Fecha de creacion. |
| actualizado_en | DATETIME |  | Fecha de actualizacion. |
| accion | VARCHAR(80) | NN | Accion ejecutada: crear, editar, importar, eliminar, etc. |
| entidad | VARCHAR(80) | NN | Nombre de la entidad afectada. |
| entidad_id | BIGINT |  | Identificador del registro afectado. |
| usuario_id | BIGINT | FK -> `usuarios.id` | Usuario responsable, si existe como cuenta del sistema. |
| usuario_responsable | VARCHAR(80) | NN | Nombre o username del responsable. |
| detalle | TEXT |  | Detalle de la operacion. |

## Relaciones principales

| Relacion | Cardinalidad | Regla de negocio |
|---|---|---|
| `personas` -> `docentes` | 1:0..1 | Una persona puede especializarse como docente. |
| `personas` -> `estudiantes` | 1:0..1 | Una persona puede especializarse como estudiante. |
| `personas` -> `padres_familia` | 1:0..1 | Una persona puede especializarse como padre/apoderado. |
| `personas` -> `administrativos` | 1:0..1 | Una persona puede especializarse como administrativo. |
| `personas` -> `usuarios` | 1:0..1 | Una persona tiene como maximo una cuenta de usuario. |
| `usuarios` <-> `roles` | N:M | Un usuario puede tener uno o mas roles. |
| `gestiones_academicas` -> `niveles_educativos` | 1:N | Una gestion agrupa niveles educativos. |
| `niveles_educativos` -> `grados` | 1:N | Un nivel contiene grados/paralelos. |
| `grados` -> `cursos` | 1:N | Un grado contiene cursos. |
| `materias` -> `cursos` | 1:N | Una materia se reutiliza en varios cursos. |
| `gestiones_academicas` -> `periodos_academicos` | 1:N | Una gestion contiene periodos de evaluacion. |
| `estudiantes` -> `matriculas` | 1:N | Un estudiante puede matricularse en grados. |
| `grados` -> `matriculas` | 1:N | Un grado tiene estudiantes matriculados. |
| `docentes` -> `asignaciones_docente` | 1:N | Un docente puede tener varios cursos asignados. |
| `cursos` -> `asignaciones_docente` | 1:N | Un curso puede tener asignaciones por periodo/docente. |
| `cursos` -> `evaluaciones` | 1:N | Un curso tiene evaluaciones por periodo. |
| `evaluaciones` -> `notas` | 1:N | Una evaluacion tiene notas por estudiante. |
| `estudiantes` -> `notas` | 1:N | Un estudiante tiene notas por evaluacion. |
| `estudiantes` -> `promedios_academicos` | 1:N | Un estudiante tiene promedios por curso y periodo. |
| `importaciones_notas` -> `notas` | 1:N | Una importacion puede generar varias notas. |
| `estudiantes` <-> `padres_familia` | N:M mediante `estudiante_apoderados` | Un padre puede consultar los estudiantes asociados. |

