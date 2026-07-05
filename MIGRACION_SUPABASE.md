# Cierre de migración Supabase

Fecha de revisión: 5 de julio de 2026. Rama revisada: `supabase-migration`.

## Qué se migró

- Login y sesión de Angular a Supabase Auth.
- Modelos e identificadores frontend a UUID.
- `AuthService`, guards, `PortalService` y `NotasService` a `@supabase/supabase-js`.
- Datos académicos a PostgreSQL con 22 tablas públicas y RLS activo.
- Permisos por rol: `ADMINISTRADOR`, `DOCENTE`, `ESTUDIANTE` y `PADRE_FAMILIA`.
- Administración segura de usuarios a `administrar-usuario`.
- Alta, edición y cambio de estado transaccional de estudiantes a `administrar-estudiante`.
- Importación Excel a `importar-notas-trimestre`.
- Datos y cuatro cuentas demo de desarrollo.

## Migraciones verificadas

1. `supabase/migrations/20260704210327_aduni_schema_rls.sql`
2. `supabase/migrations/20260704210503_optimize_rls_indexes.sql`
3. `supabase/migrations/20260704210835_demo_seed.sql`
4. `supabase/migrations/20260705033556_administrar_estudiante.sql`
5. `supabase/migrations/20260705035114_harden_notas_rls.sql`

Las cinco se aplicaron al proyecto `cpduuguhpxhxwoemzmgy`. Se comprobaron las tablas, claves UUID, funciones privadas, índices, grants y políticas. Las 22 tablas públicas reportan `rls_enabled=true`.

## Pruebas realizadas

- Los cuatro usuarios demo obtuvieron sesión válida.
- Anónimo: consulta privada bloqueada con HTTP 401.
- Administrador: acceso global y 6 personas visibles en la comprobación final.
- Docente: 1 asignación activa; se verificó que RLS rechazara una nota para un estudiante no matriculado en esa asignación.
- Estudiante: 1 perfil, 1 estudiante y solo 5 notas publicadas propias.
- Padre: 1 perfil, 1 estudiante vinculado y solo 5 notas publicadas de ese estudiante.
- Un administrador creó, editó, desactivó y reactivó un estudiante temporal mediante `administrar-estudiante`; se comprobó el error de DNI duplicado. Después creó su cuenta con `administrar-usuario`, inició sesión usando correo + DNI y se retiraron todos los datos temporales.
- Importación: preview y confirmación real con `NOTAS.xlsx` (`C:\Users\Diego\Documents\SoftEscolar\NOTAS.xlsx`). Se detectaron 23 alumnos, se mapearon dos alumnos temporales, se guardaron 12 notas individuales, 4 promedios por competencia y 2 promedios finales; se reportaron 21 alumnos no encontrados sin crearlos. Los datos temporales se retiraron tras la prueba.
- CORS: las tres funciones publican únicamente `http://localhost:4200` por defecto; ya no usan `*` y conservan `verify_jwt=true`.
- Build Angular y pruebas unitarias ejecutados correctamente.

## Errores corregidos

- Login administrativo fallaba potencialmente porque `AuthService` usaba `.single()` sin filtrar el perfil; ahora filtra por el UUID de Auth.
- Se retiró la constante heredada `http://localhost:8080/api`.
- Se adaptó `importar-notas-trimestre` a la plantilla real `NOTAS.xlsx`: cuatro bloques `F:K/L`, `M:R/S`, `T:Y/Z`, `AA:AF/AG` y promedio final `AL`. Las columnas adicionales de formato de la hoja ya no causan un rechazo falso por el límite de 40 columnas útiles.
- Se eliminó el doble insert persona/estudiante desde Angular. `administrar-estudiante` llama a una función SQL atómica, valida duplicados y registra auditoría.
- Se endureció RLS de `notas`: las políticas de escritura se sustituyeron por una comprobación de asignación activa + matrícula activa coincidente. La migración de cierre elimina además cualquier política heredada con los nombres del esquema inicial, porque PostgreSQL combina políticas permisivas con `OR`.
- Creación de usuarios: contraseña inicial = DNI de la persona; correo = correo de la persona.
- Se eliminó CORS abierto en las tres Edge Functions.
- Se retiró el botón de clonación académica que apuntaba a una operación aún no implementada y se corrigieron mensajes heredados que mencionaban un backend propio.
- Se corrigió la configuración de animaciones del test Angular.
- Se actualizaron los paquetes Angular 21 a versiones parcheadas; quedaron 0 vulnerabilidades altas o críticas. `npm audit fix` redujo el reporte a 3 avisos bajos en herramientas de compilación; el arreglo restante propone una regresión incompatible y no se aplicó con `--force`.
- Se eliminó el archivo de inspección temporal del Excel.

## Comandos de verificación

```powershell
git branch --show-current
cd frontend
npm ci
npm run build
npm test -- --watch=false
npm audit
rg -n "http://localhost:8080/api|SERVICE_ROLE|service_role" frontend
```

Comandos reproducibles de Supabase:

```powershell
npx supabase link --project-ref cpduuguhpxhxwoemzmgy
npx supabase db push
npx supabase functions deploy administrar-usuario
npx supabase functions deploy administrar-estudiante
npx supabase functions deploy importar-notas-trimestre
```

## Spring Boot eliminado

Con el build y las pruebas en verde, se retiró definitivamente el backend Spring Boot y las utilidades MySQL de desarrollo que quedaban como referencia en la rama `supabase-migration`.

### Carpetas y archivos eliminados

- `aduni-plus-backend-springboot/` completo: código Java, `pom.xml`, `application.yml`, tests JUnit, `target/` compilado y logs de Maven.
- `database/`: `schema_aduniplus_limpio.sql`, `reset_database.sql`, `seed_usuarios_prueba.sql`, `backup_aduniplus.ps1` y `modelo_relacional_limpio.md` (scripts y documentación de MySQL sin uso en esta rama).
- `implementation_plan.md`: plan de implementación redactado para el backend Spring Boot (controladores, Maven, `MultipartFile`).
- Tareas `mysql:start`, `backend:start` y `dev:start-all` de `.vscode/tasks.json`, que dependían del servicio `MYSQL80` y de `mvn spring-boot:run`; solo se conservó `frontend:start`.
- Mención a "Spring Boot" en el mensaje de error de `PortalService.clonarEstructura` y en el comentario de cabecera de la migración base.
- Interceptor Angular sin uso `frontend/src/app/core/auth.interceptor.ts`, remanente del esquema JWT manual de Spring Boot: no estaba registrado en `app.config.ts` ni usaba Supabase.

### Razón

La migración a Supabase ya cubre autenticación, datos y Edge Functions. Mantener Spring Boot y MySQL como "referencia" ya no aportaba valor y arriesgaba confusión sobre qué backend ejecutar. La rama `supabase-migration` queda como un proyecto Angular + Supabase autocontenido, sin Java, Maven ni MySQL.

### Nueva arquitectura final

```text
Angular 21 (frontend/)
  └─ @supabase/supabase-js
       ├─ Supabase Auth
       ├─ PostgreSQL + RLS (supabase/migrations/)
       └─ Edge Functions (supabase/functions/)
            ├─ administrar-estudiante
            ├─ administrar-usuario
            └─ importar-notas-trimestre
```

No queda ningún backend Java, controlador REST propio, `pom.xml` ni base de datos MySQL en la rama `supabase-migration`.

### Comandos de verificación ejecutados

```powershell
git branch --show-current
git status
cd frontend
npm ci
npm run build
npm test -- --watch=false
npm audit
cd ..
rg -n "localhost:8080|Spring Boot|spring-boot|MySQL|Maven|DB_URL|JWT_SECRET|API_URL|service_role|SERVICE_ROLE" .
git add -A
git commit -m "chore: retirar Spring Boot y finalizar migración Supabase"
```

Las únicas coincidencias restantes de esa búsqueda están en este archivo y en README.md —explicando que Spring Boot fue eliminado— y en comentarios de código que advierten no colocar `service_role` en Angular.

## Qué falta antes de producción

- Configurar `ALLOWED_ORIGIN` con el dominio HTTPS real.
- Activar la protección de contraseñas filtradas de Supabase Auth.
- Excluir el seed demo y borrar/cambiar todas las credenciales conocidas.
- Importar y conciliar datos históricos de MySQL, si se necesitan.
- Ampliar la cobertura de tests automatizados de componentes y flujos E2E.
- Atender los tres avisos de presupuesto CSS si se desea optimizar el tamaño; no bloquean el build.

Spring Boot y MySQL fueron eliminados de la rama `supabase-migration`; ver la sección [Spring Boot eliminado](#spring-boot-eliminado) para el detalle. Angular solo depende de Supabase.
