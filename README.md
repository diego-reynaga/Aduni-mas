# SoftEscolar (Aduni+)

Sistema de gestión escolar compuesto por:

- **Backend:** Java 21, Spring Boot 3.5.14, Maven y MySQL.
- **Frontend:** Angular 21, Node.js, npm y Tailwind CSS.

## 1. Programas necesarios

Instala los siguientes programas antes de ejecutar el proyecto:

| Programa | Versión para este proyecto | Descarga oficial |
| --- | --- | --- |
| Git | Versión estable | [Descargar Git](https://git-scm.com/downloads) |
| JDK | Java 21 LTS | [Descargar Eclipse Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21) |
| Maven | 3.9.x | [Descargar Apache Maven](https://maven.apache.org/download.cgi) |
| MySQL Community Server | MySQL 8.x | [Descargar MySQL Installer para Windows](https://dev.mysql.com/downloads/installer/) |
| Node.js | Node.js 24 LTS recomendado | [Descargar Node.js](https://nodejs.org/en/download) |
| npm | 11.x; el proyecto declara 11.11.0 | Se instala con Node.js |

Opcionalmente, se puede instalar [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) para administrar la base de datos mediante una interfaz gráfica.

> No es necesario instalar Angular CLI de forma global. El frontend ya incluye Angular CLI 21.2.11 como dependencia y los comandos `npm` usan esa versión local.

## 2. Verificar las instalaciones

Abre PowerShell o una terminal nueva y ejecuta:

```powershell
git --version
java -version
mvn -version
node --version
npm --version
```

Verifica especialmente que:

- `java -version` muestre Java 21.
- `mvn -version` indique que está utilizando Java 21.
- `node --version` muestre Node.js 24 LTS.
- `npm --version` muestre npm 11.x.

Si Maven no es reconocido, sigue su [guía oficial de instalación](https://maven.apache.org/install.html) y configura las variables `JAVA_HOME`, `MAVEN_HOME` y `Path`.

## 3. Descargar el proyecto

```powershell
git clone https://github.com/diego-reynaga/Aduni-mas.git SoftEscolar
cd SoftEscolar
```

La estructura principal del repositorio es:

```text
SoftEscolar/
├── aduni-plus-backend-springboot/
│   └── aduni-plus-backend/       # Spring Boot y Maven
├── frontend/                     # Angular
└── README.md
```

## 4. Configurar MySQL

1. Inicia el servicio de MySQL.
2. Abre MySQL Workbench o la consola de MySQL.
3. Ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS aduniplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

4. Abre el archivo:

```text
aduni-plus-backend-springboot/aduni-plus-backend/src/main/resources/application.yml
```

5. Configura el usuario y la contraseña de tu instalación de MySQL:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/aduniplus?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true
    username: root
    password: 12345678
```

Spring Boot generará y actualizará las tablas automáticamente porque el proyecto utiliza `spring.jpa.hibernate.ddl-auto=update`.

El esquema limpio de referencia esta en `database/schema_aduniplus_limpio.sql`. Para borrar usuarios existentes y cargar usuarios de prueba controlados, ejecuta:

```powershell
mysql -u root -p aduniplus < database\seed_usuarios_prueba.sql
```

## 5. Ejecutar el backend

Desde la raíz de `SoftEscolar`:

```powershell
cd aduni-plus-backend-springboot\aduni-plus-backend
mvn spring-boot:run
```

Espera hasta ver un mensaje que indique que la aplicación inició. Luego abre:

```text
http://localhost:8080/api/health
```

La respuesta esperada es un JSON indicando que el backend está disponible.

Mantén esta terminal abierta mientras utilizas el sistema.

## 6. Ejecutar el frontend

Abre una **segunda terminal** en la raíz de `SoftEscolar` y ejecuta:

```powershell
cd frontend
npm ci
npm start
```

`npm ci` instala exactamente las versiones registradas en `package-lock.json`.

Cuando Angular termine de compilar, abre:

```text
http://localhost:4200
```

El frontend está configurado para consumir la API en `http://localhost:8080/api`. Por eso, MySQL y el backend deben estar ejecutándose antes de usar las funciones que consultan datos.

## Credenciales de prueba

Estas cuentas se crean con `database/seed_usuarios_prueba.sql`. El script elimina primero todos los usuarios existentes y luego crea solo estas cuentas:

| Rol | Usuario | Contraseña | Persona vinculada |
| --- | --- | --- | --- |
| Administrador | `admin.test` | `Admin2026!` | ADMIN ADUNI |
| Docente | `docente.test` | `Docente2026!` | DANIEL CARDENAS |
| Padre/apoderado | `familia.test` | `Familia2026!` | FAMILIA PRUEBA |
| Estudiante | `estudiante.aparco` | `Estudiante2026!` | APARCO BERROCAL YHOSHUA ADRIEL |
| Estudiante | `estudiante.atao` | `Estudiante2026!` | ATAO MAUCAYLLE DANILO |
| Estudiante | `estudiante.carbajal` | `Estudiante2026!` | CARBAJAL QUIQUINLLA BRITNY |

## Orden recomendado para iniciar el proyecto

Cada vez que trabajes con el sistema:

1. Inicia MySQL.
2. Ejecuta el backend con `mvn spring-boot:run`.
3. Ejecuta el frontend con `npm start`.
4. Abre `http://localhost:4200`.

## Comandos útiles

### Backend

Ejecutar pruebas:

```powershell
cd aduni-plus-backend-springboot\aduni-plus-backend
mvn test
```

Las pruebas actuales cargan el contexto completo de Spring Boot, por lo que MySQL debe estar iniciado y configurado correctamente.

Compilar el archivo JAR:

```powershell
mvn clean package
```

Ejecutar el JAR compilado:

```powershell
java -jar target\aduni-plus-backend-0.0.1-SNAPSHOT.jar
```

### Frontend

Ejecutar pruebas:

```powershell
cd frontend
npm test
```

Generar una compilación de producción:

```powershell
npm run build
```

Ejecutar la compilación SSR generada, disponible en `http://localhost:4000`:

```powershell
npm run serve:ssr:frontend
```

## Importación trimestral de registro auxiliar de notas

El módulo permite importar el Excel institucional `REGISTRO DE NOTAS_1RO-ALFA.xlsx` un trimestre a la vez. No importa automáticamente otros trimestres ni usa `RESUMEN ANUAL` o `NOTA ANUAL` en este flujo:

1. Inicia MySQL, backend y frontend.
2. Ingresa como docente o administrador.
3. Docente: abre `http://localhost:4200/docente/importar-notas`.
4. Selecciona el archivo `.xlsx`, el trimestre (`I_TRIMESTRE`, `II_TRIMESTRE` o `III_TRIMESTRE`) y el curso/asignación.
5. Pulsa **Previsualizar**.
6. Revisa metadata, estudiantes encontrados, notas individuales, promedios por competencia, promedio final del trimestre y observaciones.
7. Pulsa **Confirmar importación** si no hay errores críticos.
8. Administrador: revisa el historial en `http://localhost:4200/admin/importaciones-notas`.

Endpoints principales:

```text
POST http://localhost:8080/api/notas/importar-trimestre/preview
POST http://localhost:8080/api/notas/importar-trimestre/confirmar
GET  http://localhost:8080/api/notas/importaciones
GET  http://localhost:8080/api/notas/importaciones/{id}
GET  http://localhost:8080/api/notas/importaciones/{id}/errores
```

Los `POST` reciben `multipart/form-data` con `file`, `trimestre` y `assignmentId` o `cursoId`. El backend valida `.xlsx`, tamaño máximo de 10MB, hoja seleccionada, permisos por rol, asignación docente, matrícula activa y notas en rango 0 a 20. La confirmación guarda notas individuales en `calificacion_detalle_trimestre`, promedios de competencia en `calificacion_competencia_trimestre`, promedio final en `calificacion`, `nota` y `promedio_academico`, además de la trazabilidad en `importacion_excel` y `error_importacion_excel`.

## Modelo relacional limpio

El backend apunta por defecto a la base MySQL `aduniplus`. Los scripts de respaldo, reinicio y esquema limpio están en `database/`:

```powershell
powershell -ExecutionPolicy Bypass -File database\backup_aduniplus.ps1
mysql -u root -p < database\reset_database.sql
mysql -u root -p aduniplus < database\seed_usuarios_prueba.sql
```

El esquema final está en `database/schema_aduniplus_limpio.sql` y la explicación de tablas conservadas, eliminadas, relaciones modificadas y rutas sin bucles está en `database/modelo_relacional_limpio.md`.

Prueba rápida del parser sin depender de MySQL:

```powershell
cd aduni-plus-backend-springboot\aduni-plus-backend
mvn "-Dtest=RegistroNotasExcelParserTest,RegistroNotasTrimestreParserTest" test
```

## Configuración y puertos

| Servicio | Dirección | Configuración |
| --- | --- | --- |
| MySQL | `localhost:3306` | `application.yml` |
| Backend | `http://localhost:8080/api` | `application.yml` |
| Estado del backend | `http://localhost:8080/api/health` | `HealthController` |
| Frontend en desarrollo | `http://localhost:4200` | `angular.json` |
| Frontend SSR compilado | `http://localhost:4000` | `frontend/src/server.ts` |

## Solución de problemas

### `mvn` no es reconocido

Instala Maven y agrega su carpeta `bin` a la variable de entorno `Path`. Después, cierra y vuelve a abrir la terminal.

### Maven utiliza una versión incorrecta de Java

Configura `JAVA_HOME` apuntando al JDK 21 y verifica nuevamente:

```powershell
mvn -version
```

### Error `Access denied for user` al iniciar el backend

El usuario o la contraseña de MySQL no coincide con `application.yml`. Actualiza los valores de `spring.datasource.username` y `spring.datasource.password`.

### Error `Communications link failure`

Comprueba que el servicio de MySQL esté iniciado y que escuche en el puerto `3306`.

### El puerto `8080` o `4200` está ocupado

Busca el proceso que usa el puerto:

```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :4200
```

Después, cierra el proceso correspondiente o cambia la configuración del puerto.

### El frontend no puede conectarse al backend

Verifica:

1. Que `http://localhost:8080/api/health` responda correctamente.
2. Que el frontend se abra desde `http://localhost:4200`.
3. Que la constante `frontend/src/app/core/api.constants.ts` apunte a `http://localhost:8080/api`.
