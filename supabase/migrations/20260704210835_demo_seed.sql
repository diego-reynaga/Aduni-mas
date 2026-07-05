-- DEVELOPMENT-ONLY seed. Credentials are intentionally documented in README.
-- Remove or rotate every password before using this project with real data.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  is_sso_user, is_anonymous
)
values
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000001','authenticated','authenticated','admin@aduni.local',extensions.crypt('Dev!Aduni2026#Admin', extensions.gen_salt('bf')),now(),'','','','', '{"provider":"email","providers":["email"],"rol":"ADMINISTRADOR"}', '{}',false,now(),now(),false,false),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000002','authenticated','authenticated','docente@aduni.local',extensions.crypt('Dev!Aduni2026#Docente', extensions.gen_salt('bf')),now(),'','','','', '{"provider":"email","providers":["email"],"rol":"DOCENTE"}', '{}',false,now(),now(),false,false),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000003','authenticated','authenticated','estudiante@aduni.local',extensions.crypt('Dev!Aduni2026#Estudiante', extensions.gen_salt('bf')),now(),'','','','', '{"provider":"email","providers":["email"],"rol":"ESTUDIANTE"}', '{}',false,now(),now(),false,false),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-4000-8000-000000000004','authenticated','authenticated','padre@aduni.local',extensions.crypt('Dev!Aduni2026#Padre', extensions.gen_salt('bf')),now(),'','','','', '{"provider":"email","providers":["email"],"rol":"PADRE_FAMILIA"}', '{}',false,now(),now(),false,false);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
values
  ('admin@aduni.local','20000000-0000-4000-8000-000000000001','{"sub":"20000000-0000-4000-8000-000000000001","email":"admin@aduni.local","email_verified":true}','email',now(),now(),now(),'21000000-0000-4000-8000-000000000001'),
  ('docente@aduni.local','20000000-0000-4000-8000-000000000002','{"sub":"20000000-0000-4000-8000-000000000002","email":"docente@aduni.local","email_verified":true}','email',now(),now(),now(),'21000000-0000-4000-8000-000000000002'),
  ('estudiante@aduni.local','20000000-0000-4000-8000-000000000003','{"sub":"20000000-0000-4000-8000-000000000003","email":"estudiante@aduni.local","email_verified":true}','email',now(),now(),now(),'21000000-0000-4000-8000-000000000003'),
  ('padre@aduni.local','20000000-0000-4000-8000-000000000004','{"sub":"20000000-0000-4000-8000-000000000004","email":"padre@aduni.local","email_verified":true}','email',now(),now(),now(),'21000000-0000-4000-8000-000000000004');

insert into public.personas (id,nombres,apellidos,numero_documento,fecha_nacimiento,correo,telefono)
values
  ('10000000-0000-4000-8000-000000000001','Ana','Administradora','70000001','1988-02-10','admin@aduni.local','900000001'),
  ('10000000-0000-4000-8000-000000000002','Diego','Docente Demo','70000002','1990-04-15','docente@aduni.local','900000002'),
  ('10000000-0000-4000-8000-000000000003','Elena','Estudiante Demo','70000003','2011-06-20','estudiante@aduni.local','900000003'),
  ('10000000-0000-4000-8000-000000000004','Esteban','Segundo Estudiante','70000004','2011-09-12',null,null),
  ('10000000-0000-4000-8000-000000000005','Paolo','Padre Demo','70000005','1982-11-05','padre@aduni.local','900000005');

insert into public.profiles (id,persona_id,rol,username)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ADMINISTRADOR','admin@aduni.local'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','DOCENTE','docente@aduni.local'),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','ESTUDIANTE','estudiante@aduni.local'),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005','PADRE_FAMILIA','padre@aduni.local');

insert into public.administrativos (id,persona_id,codigo,cargo)
values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ADM-DEMO-01','Administradora');

insert into public.docentes (id,persona_id,codigo,especialidad,area_academica)
values ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','DOC-DEMO-01','Matemática','Ciencias');

insert into public.estudiantes (id,persona_id,codigo)
values
  ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','EST-DEMO-01'),
  ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','EST-DEMO-02');

insert into public.padres_familia (id,persona_id,ocupacion)
values ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','Ingeniero');

insert into public.gestiones (id,anio,nombre,fecha_inicio,fecha_fin,activa)
values ('40000000-0000-4000-8000-000000000001',2026,'Gestión 2026','2026-03-01','2026-12-20',true);

insert into public.niveles (id,gestion_id,nombre,turno,descripcion)
values ('40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','Secundaria','MANANA','Nivel demo');

insert into public.grados (id,nivel_id,nombre,paralelo,capacidad)
values ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','Tercero','A',30);

insert into public.materias (id,codigo,nombre,area)
values ('40000000-0000-4000-8000-000000000004','MAT-01','Matemática','Ciencias');

insert into public.cursos (id,grado_id,materia_id)
values ('40000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');

insert into public.periodos (id,gestion_id,nombre,orden,fecha_inicio,fecha_fin)
values ('40000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000001','I TRIMESTRE',1,'2026-03-01','2026-05-31');

insert into public.matriculas (id,codigo,estudiante_id,grado_id,gestion_id,fecha_matricula,estado)
values
  ('40000000-0000-4000-8000-000000000007','MAT-DEMO-01','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','2026-03-01','ACTIVA'),
  ('40000000-0000-4000-8000-000000000008','MAT-DEMO-02','30000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','2026-03-01','ACTIVA');

insert into public.asignaciones_docente (id,docente_id,curso_id,periodo_id,estado)
values ('40000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000006','ACTIVA');

insert into public.estudiante_apoderados (id,estudiante_id,padre_familia_id,parentesco,principal)
values ('40000000-0000-4000-8000-00000000000a','30000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000005','PADRE',true);

insert into public.notas (id,estudiante_id,asignacion_docente_id,trimestre,tipo,valor,logro_literal,publicado,registrado_por)
values
  ('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000009','I_TRIMESTRE','PRACTICA',16,null,true,'20000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000009','I_TRIMESTRE','EXAMEN',15,null,true,'20000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000009','I_TRIMESTRE','TAREA',18,null,true,'20000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000009','I_TRIMESTRE','PARTICIPACION',17,null,true,'20000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000009','I_TRIMESTRE','PROMEDIO_FINAL',16.50,'A',true,'20000000-0000-4000-8000-000000000002');

insert into public.auditoria (accion,entidad,usuario_responsable,detalle)
values ('SEED_DESARROLLO','sistema','migration',jsonb_build_object('advertencia','Datos y contraseñas solo para desarrollo'));
