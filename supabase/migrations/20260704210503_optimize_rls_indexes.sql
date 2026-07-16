-- Follow-up from Supabase Performance Advisor: cover every FK and avoid
-- evaluating two permissive policies for the same role/action.

create index asignaciones_periodo_idx on public.asignaciones_docente(periodo_id);
create index competencia_asignacion_idx on public.calificacion_competencia_trimestre(asignacion_docente_id);
create index competencia_importacion_idx on public.calificacion_competencia_trimestre(importacion_id);
create index detalle_asignacion_idx on public.calificacion_detalle_trimestre(asignacion_docente_id);
create index detalle_importacion_idx on public.calificacion_detalle_trimestre(importacion_id);
create index importaciones_usuario_idx on public.importaciones_notas(usuario_id);
create index matriculas_gestion_idx on public.matriculas(gestion_id);
create index notas_importacion_idx on public.notas(importacion_id);
create index notas_registrado_por_idx on public.notas(registrado_por);

-- Replace broad admin FOR ALL policies with command-specific policies. SELECT
-- access is folded into each table's existing scoped policy.
do $$
declare
  t text;
begin
  foreach t in array array[
    'personas','profiles','docentes','estudiantes','padres_familia','administrativos','estudiante_apoderados',
    'gestiones','niveles','grados','materias','cursos','periodos','matriculas',
    'asignaciones_docente','notas','importaciones_notas','errores_importacion_notas',
    'calificacion_detalle_trimestre','calificacion_competencia_trimestre','auditoria',
    'configuracion_institucional'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
  end loop;

  foreach t in array array[
    'personas','profiles','docentes','estudiantes','padres_familia','administrativos','estudiante_apoderados',
    'gestiones','niveles','grados','materias','cursos','periodos','matriculas',
    'asignaciones_docente','importaciones_notas','errores_importacion_notas',
    'calificacion_detalle_trimestre','calificacion_competencia_trimestre','auditoria',
    'configuracion_institucional'
  ] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))', t || '_admin_delete', t);
  end loop;
end
$$;

drop policy profiles_own_select on public.profiles;
create policy profiles_scoped_select on public.profiles for select to authenticated
using ((select private.is_admin()) or ((select auth.uid()) = id and activo));

drop policy docentes_own_select on public.docentes;
create policy docentes_scoped_select on public.docentes for select to authenticated
using ((select private.is_admin()) or persona_id = (select private.current_persona_id()));

drop policy padres_own_select on public.padres_familia;
create policy padres_scoped_select on public.padres_familia for select to authenticated
using ((select private.is_admin()) or persona_id = (select private.current_persona_id()));

drop policy administrativos_own_select on public.administrativos;
create policy administrativos_scoped_select on public.administrativos for select to authenticated
using ((select private.is_admin()) or persona_id = (select private.current_persona_id()));

drop policy vinculos_scoped_select on public.estudiante_apoderados;
create policy vinculos_scoped_select on public.estudiante_apoderados for select to authenticated
using (
  (select private.is_admin())
  or (select private.is_estudiante_owner(estudiante_id))
  or (select private.is_padre_de_estudiante(estudiante_id))
);

drop policy notas_scoped_select on public.notas;
create policy notas_scoped_select on public.notas for select to authenticated
using (
  (select private.is_admin())
  or (
    (select private.can_access_asignacion(asignacion_docente_id))
    and (
      (select private.current_user_role()) = 'DOCENTE'::public.app_role
      or (
        publicado
        and (
          (select private.is_estudiante_owner(estudiante_id))
          or (select private.is_padre_de_estudiante(estudiante_id))
        )
      )
    )
  )
);

drop policy notas_docente_insert on public.notas;
create policy notas_docente_or_admin_insert on public.notas for insert to authenticated
with check (
  (select private.is_admin())
  or (
    registrado_por = (select auth.uid())
    and (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.is_docente_de_estudiante(estudiante_id))
  )
);

drop policy notas_docente_update on public.notas;
create policy notas_docente_or_admin_update on public.notas for update to authenticated
using (
  (select private.is_admin())
  or (
    (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.current_user_role()) = 'DOCENTE'::public.app_role
  )
)
with check (
  (select private.is_admin())
  or (
    registrado_por = (select auth.uid())
    and (select private.can_access_asignacion(asignacion_docente_id))
    and (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.is_docente_de_estudiante(estudiante_id))
  )
);

create policy notas_admin_delete on public.notas for delete to authenticated
using ((select private.is_admin()));

drop policy importaciones_docente_select on public.importaciones_notas;
create policy importaciones_scoped_select on public.importaciones_notas for select to authenticated
using (
  (select private.is_admin())
  or (
    usuario_id = (select auth.uid())
    and (select private.can_access_asignacion(asignacion_docente_id))
  )
);

drop policy detalle_trimestre_scoped_select on public.calificacion_detalle_trimestre;
create policy detalle_trimestre_scoped_select on public.calificacion_detalle_trimestre for select to authenticated
using (
  (select private.is_admin())
  or (
    (select private.can_access_asignacion(asignacion_docente_id))
    and (
      (select private.current_user_role()) = 'DOCENTE'::public.app_role
      or exists (
        select 1 from public.notas n
        where n.estudiante_id = calificacion_detalle_trimestre.estudiante_id
          and n.asignacion_docente_id = calificacion_detalle_trimestre.asignacion_docente_id
          and n.trimestre = calificacion_detalle_trimestre.trimestre
          and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
          and n.publicado
          and (
            (select private.is_estudiante_owner(n.estudiante_id))
            or (select private.is_padre_de_estudiante(n.estudiante_id))
          )
      )
    )
  )
);

drop policy competencia_trimestre_scoped_select on public.calificacion_competencia_trimestre;
create policy competencia_trimestre_scoped_select on public.calificacion_competencia_trimestre for select to authenticated
using (
  (select private.is_admin())
  or (
    (select private.can_access_asignacion(asignacion_docente_id))
    and (
      (select private.current_user_role()) = 'DOCENTE'::public.app_role
      or exists (
        select 1 from public.notas n
        where n.estudiante_id = calificacion_competencia_trimestre.estudiante_id
          and n.asignacion_docente_id = calificacion_competencia_trimestre.asignacion_docente_id
          and n.trimestre = calificacion_competencia_trimestre.trimestre
          and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
          and n.publicado
          and (
            (select private.is_estudiante_owner(n.estudiante_id))
            or (select private.is_padre_de_estudiante(n.estudiante_id))
          )
      )
    )
  )
);

create policy auditoria_admin_select on public.auditoria for select to authenticated
using ((select private.is_admin()));
