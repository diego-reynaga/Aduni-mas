# Cierre de migración Supabase

Fecha de revisión: 4 de julio de 2026. Rama revisada: `supabase-migration`.

## Qué se migró

- Login y sesión de Angular a Supabase Auth.
- Modelos e identificadores frontend a UUID.
- `AuthService`, guards, `PortalService` y `NotasService` a `@supabase/supabase-js`.
- Datos académicos a PostgreSQL con 22 tablas públicas y RLS activo.
- Permisos por rol: `ADMINISTRADOR`, `DOCENTE`, `ESTUDIANTE` y `PADRE_FAMILIA`.
- Administración segura de usuarios a `administrar-usuario`.
- Importación Excel a `importar-notas-trimestre`.
- Datos y cuatro cuentas demo de desarrollo.

## Migraciones verificadas

1. `supabase/migrations/20260704204452_aduni_schema_rls.sql`
2. `supabase/migrations/20260704210406_optimize_rls_indexes.sql`
3. `supabase/migrations/20260704210647_demo_seed.sql`

Las tres se aplicaron al proyecto `cpduuguhpxhxwoemzmgy`. Se comprobaron las tablas, claves UUID, funciones privadas, índices, grants y políticas. Las 22 tablas públicas reportan `rls_enabled=true`.

## Pruebas realizadas

- Los cuatro usuarios demo obtuvieron sesión válida.
- Anónimo: consulta privada bloqueada con HTTP 401.
- Administrador: 4 perfiles, 2 estudiantes, 1 asignación y acceso global.
- Docente: 1 perfil propio, 2 estudiantes de su curso, 1 asignación y escritura de una nota propia.
- Estudiante: 1 perfil, 1 estudiante y solo 5 notas publicadas propias.
- Padre: 1 perfil, 1 estudiante vinculado y solo 5 notas publicadas de ese estudiante.
- Un administrador creó un usuario temporal mediante `administrar-usuario`, se verificó su login y se retiró el dato temporal.
- Importación: preview de 2 estudiantes, 0 errores y confirmación correcta; se guardaron 48 detalles, 8 promedios por competencia y 2 promedios finales.
- CORS: las funciones publican únicamente `http://localhost:4200` por defecto; ya no usan `*`.
- Build Angular y pruebas unitarias ejecutados correctamente.

## Errores corregidos

- Login administrativo fallaba potencialmente porque `AuthService` usaba `.single()` sin filtrar el perfil; ahora filtra por el UUID de Auth.
- Se retiró la constante heredada `http://localhost:8080/api`.
- Se eliminó CORS abierto en las dos Edge Functions.
- Se corrigió la configuración de animaciones del test Angular.
- Se actualizaron los paquetes Angular 21 a versiones parcheadas; quedaron 0 vulnerabilidades altas o críticas. `npm audit` conserva 4 avisos bajos en herramientas de compilación que requieren un salto mayor de Angular.
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
npx supabase functions deploy importar-notas-trimestre
```

## Qué falta antes de producción

- Configurar `ALLOWED_ORIGIN` con el dominio HTTPS real.
- Activar la protección de contraseñas filtradas de Supabase Auth.
- Excluir el seed demo y borrar/cambiar todas las credenciales conocidas.
- Importar y conciliar datos históricos de MySQL, si se necesitan.
- Ampliar la cobertura de tests automatizados de componentes y flujos E2E.
- Atender los tres avisos de presupuesto CSS si se desea optimizar el tamaño; no bloquean el build.

Spring Boot y MySQL quedan solo como referencia/transición y no deben iniciarse para usar Angular en esta rama.
