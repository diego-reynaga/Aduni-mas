# Aduni+

Sistema escolar integral para administradores, docentes, estudiantes y padres de familia. El backend usa Spring Boot 3.5, Java 21, Maven y MySQL 8; el frontend usa Angular 21 y npm.

## Rama de trabajo

Todo el desarrollo consolidado vive en `postProduccion`, que es la capitalización real de la rama remota equivalente a `postproduccion`:

```powershell
git switch postProduccion
git status --short --branch
```

No ejecute estos cambios desde `master` ni desde otra rama.

## Requisitos

- JDK 21
- Maven 3.9 o superior
- MySQL 8
- Node.js 24 LTS y npm 11

## Configurar MySQL

Inicie MySQL y cree la base:

```sql
CREATE DATABASE IF NOT EXISTS aduniplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

El backend acepta variables de entorno. En PowerShell:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/aduniplus?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "su_clave_mysql"
$env:JWT_SECRET = "una-clave-segura-de-al-menos-32-caracteres"
$env:SEED_ENABLED = "true"
```

Si no define variables, `application.yml` usa `root`, contraseña `12345678`, base `aduniplus` y activa los datos de desarrollo. En un entorno real use `SEED_ENABLED=false` y cambie `JWT_SECRET`.

## Ejecutar backend

```powershell
cd aduni-plus-backend-springboot\aduni-plus-backend
mvn clean test
mvn spring-boot:run
```

La API queda en `http://localhost:8080/api` y la comprobación de salud en `http://localhost:8080/api/health`.

## Ejecutar frontend

En otra terminal:

```powershell
cd frontend
npm ci
npm start
```

Abra `http://localhost:4200`. El frontend consume `http://localhost:8080/api`.

## Usuarios de prueba

El inicializador crea datos idempotentes con contraseñas BCrypt. Todos usan la contraseña `Aduni1234!`.

| Rol | Usuario | Contenido disponible |
| --- | --- | --- |
| Administrador | `admin` | CRUD completo, matrículas, asignaciones y vínculos |
| Docente | `docente` | Cursos, registro manual e importación Excel |
| Estudiante | `estudiante` | Notas publicadas de Lucía Quispe |
| Estudiante | `estudiante2` | Notas publicadas de Mateo Ramos |
| Padre / apoderado | `padre` | Notas de Lucía, su hija vinculada |
| Padre / apoderado | `padre2` | Notas de Mateo, su hijo vinculado |

También se crean la gestión 2026, tres trimestres, nivel Secundaria, grado 1ro A, Matemática, Comunicación, dos matrículas, asignaciones docentes, vínculos familiares y notas publicadas de ejemplo.

## Flujo de uso por rol

### Administrador

1. Entre con `admin`.
2. En **Personal y Familia**, cree docentes, administrativos y padres/apoderados.
3. En **Matrículas y Alumnos**, cree o edite estudiantes y complete su matrícula.
4. En **Personas y usuarios**, cree la cuenta y asigne uno o más roles.
5. En **Gestión académica**, configure niveles, grados/secciones, materias y cursos.
6. En **Periodos y asignaciones**, cree la gestión, los trimestres y asigne cursos a docentes.
7. En **Vínculos familiares**, relacione cada estudiante con sus apoderados.
8. Revise actividad e importaciones desde los paneles de supervisión.

### Docente

1. Entre con `docente`.
2. Revise sus cursos en **Carga docente**.
3. Registre notas de 0 a 20 en **Acta de notas**.
4. Use **Importación Excel** para cargar un único trimestre por vez.

### Estudiante

Entre con `estudiante`. Solo verá sus propios cursos, notas y promedios publicados.

### Padre o apoderado

Entre con `padre`. Solo verá los estudiantes que el administrador vinculó a su cuenta y sus notas publicadas.

## Importar notas Excel por trimestre

El flujo acepta únicamente `.xlsx` de hasta 10 MB y nunca crea estudiantes desde el archivo:

1. Seleccione el curso asignado.
2. Seleccione `I_TRIMESTRE`, `II_TRIMESTRE` o `III_TRIMESTRE`.
3. Suba el Excel.
4. Pulse **Previsualizar** y revise estudiantes, notas individuales, promedios por competencia, promedio final y observaciones.
5. Corrija los errores críticos o descargue el reporte CSV.
6. Pulse **Confirmar importación**.

El backend valida docente autenticado, asignación activa, trimestre, curso, matrícula, estudiante existente y rango 0–20. La confirmación guarda notas, promedios, historial, errores y auditoría. El administrador puede revisar el historial en **Importaciones notas**.

Endpoints principales:

```text
POST /api/notas/importar-trimestre/preview
POST /api/notas/importar-trimestre/confirmar
GET  /api/notas/importaciones
GET  /api/notas/importaciones/{id}
GET  /api/notas/importaciones/{id}/errores
```

Los `POST` reciben `multipart/form-data` con `file`, `trimestre` y `assignmentId`.

## Pruebas y compilación

Backend:

```powershell
cd aduni-plus-backend-springboot\aduni-plus-backend
mvn clean test
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
npm ci
npm run build
npm test -- --watch=false
```

Las pruebas backend usan H2 en memoria mediante el perfil `test`; no modifican MySQL. Para desactivar el seeder en una ejecución concreta:

```powershell
$env:SEED_ENABLED = "false"
mvn spring-boot:run
```

## Estructura principal

```text
aduni-plus-backend-springboot/aduni-plus-backend/  Spring Boot
frontend/                                          Angular
database/                                          esquema y utilidades MySQL
```
