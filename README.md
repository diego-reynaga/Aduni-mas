# Aduni+ — Angular + Supabase

Aduni+ es un sistema de gestión académica construido con Angular 21 y Supabase. Angular consume Supabase directamente: Supabase Auth gestiona sesiones, PostgreSQL conserva los datos, Row Level Security (RLS) aplica permisos y las Edge Functions resuelven la administración de usuarios y la importación Excel.

Spring Boot y MySQL fueron retirados del repositorio: ya no existen backend Java, `pom.xml` ni base de datos MySQL. Angular no llama a `http://localhost:8080/api` ni a ningún backend propio; toda la lógica de servidor vive en Supabase (PostgreSQL, Auth y Edge Functions). Consulte [MIGRACION_SUPABASE.md](MIGRACION_SUPABASE.md) para el detalle de qué se eliminó y por qué.

## Arquitectura

```text
Angular 21
  ├─ @supabase/supabase-js (publishable key)
  ├─ Supabase Auth
  ├─ Supabase Data API → PostgreSQL + RLS
  └─ Edge Functions
       ├─ administrar-usuario
       └─ importar-notas-trimestre
```

No se usa Supabase Storage: los archivos Excel se validan y procesan en memoria, y solo se guardan historial, errores y resultados. La clave `service_role` existe únicamente en el entorno seguro de las Edge Functions; nunca debe copiarse a Angular, Git o variables públicas.

## Requisitos

- Node.js 24 LTS y npm 11.
- Supabase CLI reciente.
- Un proyecto Supabase.
- Rama Git `supabase-migration`.

Compruebe la rama antes de trabajar:

```powershell
git switch supabase-migration
git status --short --branch
```

## Configurar Supabase

1. Cree un proyecto desde el panel de Supabase.
2. Copie **Project URL** y la **Publishable key** desde **Project Settings → API Keys**.
3. En **Authentication → URL Configuration**, registre `http://localhost:4200` como URL local.
4. Para producción, active la protección contra contraseñas filtradas en **Authentication → Password Security**.
5. Configure el origen permitido de las Edge Functions:

```powershell
npx supabase secrets set ALLOWED_ORIGIN=https://su-frontend.example
```

En desarrollo, si no se define el secreto, las funciones permiten únicamente `http://localhost:4200`. Cualquier otro origen recibe una cabecera CORS que no coincide y el navegador bloquea la respuesta.

El proyecto de desarrollo revisado usa el ref `cpduuguhpxhxwoemzmgy`.

### Aplicar migraciones

```powershell
npx supabase login
npx supabase link --project-ref cpduuguhpxhxwoemzmgy
npx supabase db push
```

Se aplican, en orden:

- `20260704204452_aduni_schema_rls.sql`: esquema UUID, funciones privadas, permisos y RLS.
- `20260704210406_optimize_rls_indexes.sql`: índices de claves foráneas y políticas consolidadas.
- `20260704210647_demo_seed.sql`: usuarios y datos exclusivamente de desarrollo.

La tercera migración crea usuarios de Auth con contraseñas conocidas. No la use en producción; elimine o sustituya esos usuarios antes de publicar el sistema.

### Desplegar Edge Functions

```powershell
npx supabase functions deploy administrar-usuario
npx supabase functions deploy importar-notas-trimestre
```

Ambas funciones deben conservar la verificación JWT habilitada. Supabase proporciona `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` dentro del runtime; no cree un archivo con esos secretos.

## Configurar Angular

Edite `frontend/src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://SU-PROJECT-REF.supabase.co',
  supabaseAnonKey: 'sb_publishable_...',
};
```

La publishable key puede vivir en el navegador porque RLS es la barrera de autorización. No agregue `service_role`, una secret key ni credenciales de base de datos.

Ejecute:

```powershell
cd frontend
npm ci
npm run build
npm test -- --watch=false
npm start
```

Abra [http://localhost:4200](http://localhost:4200).

## Usuarios demo

Solo para desarrollo:

| Rol | Correo | Contraseña | Prueba principal |
| --- | --- | --- | --- |
| Administrador | `admin@aduni.local` | `Dev!Aduni2026#Admin` | CRUD, usuarios, matrículas, asignaciones, vínculos, auditoría |
| Docente | `docente@aduni.local` | `Dev!Aduni2026#Docente` | Sus cursos, notas manuales e importación Excel |
| Estudiante | `estudiante@aduni.local` | `Dev!Aduni2026#Estudiante` | Solo sus notas publicadas y promedios |
| Padre/apoderado | `padre@aduni.local` | `Dev!Aduni2026#Padre` | Solo las notas del hijo vinculado |

Las direcciones `.local` son cuentas de prueba creadas por la migración; no dependen del envío real de correo.

## Flujo por rol

### Administrador

Inicie sesión y use los módulos administrativos para crear personas, subtipos (docente, estudiante o padre), usuarios de Auth, gestión, nivel, grado, materia, curso, periodo, matrícula, asignación docente y vínculo familiar. Al crear un usuario nuevo, las credenciales iniciales son el correo de la persona y su DNI como contraseña.

### Docente

El docente ve solamente asignaciones activas propias. Puede guardar notas de 0 a 20 y usar **Importación Excel**. RLS valida la asignación también en escrituras; la Edge Function repite la validación antes de usar `service_role`.

### Estudiante

El estudiante accede solo a su registro, matrícula, cursos y notas publicadas. No dispone de políticas de escritura.

### Padre o apoderado

El padre ve únicamente estudiantes con un vínculo activo en `estudiante_apoderados` y sus notas publicadas. No dispone de políticas de escritura.

## Probar importación Excel

Plantilla universal de notas:

`C:\Users\Diego\Documents\SoftEscolar\NOTAS.xlsx`

Hojas relevantes: `INICIO`, `I TRIMESTRE`, `II TRIMESTRE`, `III TRIMESTRE`. La función lee metadatos desde `INICIO` y las notas desde la hoja del trimestre seleccionado (fila 17 en adelante, columnas PRACTICA/EXAMEN/CUADERNO por competencia).

También se incluye un archivo demo en `outputs/aduni-supabase-migration/registro-notas-demo.xlsx`.

1. Inicie sesión como docente.
2. Abra **Importación Excel**.
3. Seleccione la asignación y el trimestre (`I_TRIMESTRE`, `II_TRIMESTRE` o `III_TRIMESTRE`).
4. Suba `NOTAS.xlsx` o el demo incluido.
5. Pulse **Previsualizar** y confirme estudiantes mapeados sin errores críticos.
6. Pulse **Confirmar importación**.
7. Revise el historial y los promedios guardados.

La función acepta solo `.xlsx`, máximo 10 MB, 12 hojas, 100 estudiantes, 40 columnas útiles, 5000 celdas procesadas y 50 MB descomprimidos. Lee desde la fila 17, no evalúa fórmulas, no crea estudiantes y rechaza contenedores ZIP inválidos, cifrados o sospechosos.

## Usuario nuevo creado por el administrador

Al crear una cuenta desde **Administración → Usuarios**:

- **Usuario:** correo de la persona.
- **Contraseña inicial:** número de documento (DNI).
- Mensaje mostrado: *Usuario creado. Credenciales iniciales: correo y DNI.*

La Edge Function `administrar-usuario` valida JWT, perfil activo y rol `ADMINISTRADOR` antes de usar la API administrativa de Auth.

## Seguridad RLS

Todas las tablas públicas tienen RLS activo. Las funciones `current_user_role()`, `current_persona_id()`, `is_admin()`, `is_docente_asignado()`, `is_estudiante_owner()` e `is_padre_de_estudiante()` viven en el esquema privado, usan `SECURITY DEFINER`, fijan un `search_path` vacío y no son ejecutables por usuarios anónimos.

El usuario anónimo no tiene permisos sobre datos privados. El administrador gestiona todo; docentes, estudiantes y padres reciben solo las filas correspondientes a su relación académica.

## Estado del proyecto

- Angular consume exclusivamente Supabase: no existen controladores propios, JWT manual, backend Java ni base de datos MySQL.
- Spring Boot, Maven y MySQL fueron eliminados de esta rama junto con `aduni-plus-backend-springboot/`, `database/` y la documentación que exigía iniciar Spring Boot.
- Antes de producción se deben retirar el seed demo, cambiar contraseñas, configurar el dominio real en `ALLOWED_ORIGIN` y activar la protección de contraseñas filtradas.

La revisión técnica, resultados y comandos ejecutados están en [MIGRACION_SUPABASE.md](MIGRACION_SUPABASE.md).
