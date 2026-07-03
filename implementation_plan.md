# Módulo de Configuración Institucional

Este documento describe el plan técnico para implementar el módulo central del sistema, permitiendo la gestión de la identidad corporativa, el ciclo escolar y los periodos académicos.

## User Review Required

> [!IMPORTANT]
> El diseño propuesto contempla lógica crítica en la base de datos, como la transición automática de años escolares activos. Por favor, revisa las preguntas abiertas antes de que comience a codificar.

## Open Questions

1. **Gestión de Archivos (Logo):** El prompt menciona subir el logo a S3, Cloudinary o Firebase. En esta iteración de desarrollo local, ¿prefieres que simule el proceso retornando una URL dummy (ej. `/assets/logo-dummy.png`), o deseas que lo almacene físicamente en una carpeta pública local del servidor de Spring Boot (`src/main/resources/static/uploads`)?
2. **Validación de Fechas de Periodos:** ¿Deseas que el backend valide estrictamente que las fechas de un periodo (ej. 1° Bimestre) no se solapen con las fechas de otro periodo (ej. 2° Bimestre) dentro del mismo año escolar?

## Proposed Changes

### 1. Submódulo: Información de la Institución
- **Backend:**
  - Crear `InstitucionController` y `InstitucionService`.
  - Crear endpoint `GET /api/institucion` (obtiene la config con código 'PRINCIPAL').
  - Crear endpoint `PUT /api/institucion` para actualizar los datos, validando formato de RUC (11 dígitos) y correo.
  - Crear endpoint `POST /api/institucion/upload-logo` manejando archivos `MultipartFile`.
- **Frontend (`admin-institution`):**
  - Vista con formulario centralizado. Input tipo "file" para subir la imagen, con visualización previa (preview) antes de subir.

### 2. Submódulo: Gestiones Académicas
- **Backend:**
  - Actualizar `AcademicoController` o crear un `GestionAcademicaController`.
  - Endpoint `POST/PUT`: Si el request indica `activa = true`, el servicio ejecuta una transacción que actualiza `activa = false` en cualquier otra gestión registrada antes de guardar la actual.
  - Validación de que `fecha_inicio` < `fecha_fin` y control del `uk_gestiones_anio`.
- **Frontend:**
  - Pestaña "Años Escolares".
  - Tabla que liste las gestiones con un Badge visual resaltando cuál es la gestión actual (Activa). Botón para desactivar/cerrar el año.

### 3. Submódulo: Periodos Académicos
- **Backend:**
  - Crear DTOs, Repository (ya existente pero agregar constraints), Service y Controller para `PeriodoAcademico`.
  - Manejo del campo `cerrado`. Cuando se cierra, ninguna nota puede ser agregada a la base de datos si su curso pertenece a ese periodo (Se implementará la validación estructural o un AOP posterior en el módulo de Notas).
- **Frontend:**
  - Pestaña "Periodos Académicos" dependiente de la Gestión seleccionada.
  - Grilla interactiva. Switch (Toggle) para "Bloquear / Cerrar Periodo" con un Modal de confirmación indicando: *"Atención: Esto congelará las notas de los estudiantes para este periodo"*.

## Verification Plan

### Automated Tests
- Compilación del backend con Maven.
- Validación de que no se rompan otros módulos existentes (ej. Estructura Académica).

### Manual Verification
- Ingresar al módulo en el Frontend como Administrador.
- Intentar activar una Gestión Académica y comprobar en la BD que la anterior se desactivó.
- Intentar poner un RUC inválido (10 dígitos o letras) y recibir el error de validación del backend.
- Cambiar el logo y comprobar que se visualiza en el frontend tras guardar.
