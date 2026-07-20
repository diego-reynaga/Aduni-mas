-- Optimize RLS policy for calificacion_detalle_trimestre by short-circuiting role checks
drop policy if exists detalle_trimestre_scoped_select on public.calificacion_detalle_trimestre;
create policy detalle_trimestre_scoped_select on public.calificacion_detalle_trimestre for select to authenticated
using (
  (select private.is_admin())
  or (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.can_access_asignacion(asignacion_docente_id))
  )
  or (
    (select private.current_user_role()) = 'ESTUDIANTE'::public.app_role
    and (select private.is_estudiante_owner(estudiante_id))
    and exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_detalle_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_detalle_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_detalle_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
    )
  )
  or (
    (select private.current_user_role()) = 'PADRE_FAMILIA'::public.app_role
    and (select private.is_padre_de_estudiante(estudiante_id))
    and exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_detalle_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_detalle_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_detalle_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
    )
  )
);

-- Optimize RLS policy for calificacion_competencia_trimestre by short-circuiting role checks
drop policy if exists competencia_trimestre_scoped_select on public.calificacion_competencia_trimestre;
create policy competencia_trimestre_scoped_select on public.calificacion_competencia_trimestre for select to authenticated
using (
  (select private.is_admin())
  or (
    (select private.current_user_role()) = 'DOCENTE'::public.app_role
    and (select private.can_access_asignacion(asignacion_docente_id))
  )
  or (
    (select private.current_user_role()) = 'ESTUDIANTE'::public.app_role
    and (select private.is_estudiante_owner(estudiante_id))
    and exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_competencia_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_competencia_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_competencia_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
    )
  )
  or (
    (select private.current_user_role()) = 'PADRE_FAMILIA'::public.app_role
    and (select private.is_padre_de_estudiante(estudiante_id))
    and exists (
      select 1 from public.notas n
      where n.estudiante_id = calificacion_competencia_trimestre.estudiante_id
        and n.asignacion_docente_id = calificacion_competencia_trimestre.asignacion_docente_id
        and n.trimestre = calificacion_competencia_trimestre.trimestre
        and n.tipo = 'PROMEDIO_FINAL'::public.tipo_nota
        and n.publicado
    )
  )
);
