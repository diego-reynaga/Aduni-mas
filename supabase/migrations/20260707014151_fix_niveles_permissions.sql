-- Asegurar que el rol authenticated tenga permisos explícitos de inserción y modificación
GRANT INSERT, UPDATE, DELETE ON public.niveles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.grados TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.materias TO authenticated;

-- (Opcional) Recrear o asegurar las políticas de admin para evitar cualquier problema de RLS si se perdieron
DO $$
BEGIN
  -- niveles
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'niveles' AND policyname = 'niveles_admin_all'
  ) THEN
      CREATE POLICY niveles_admin_all ON public.niveles FOR ALL TO authenticated USING ((select private.is_admin())) WITH CHECK ((select private.is_admin()));
  END IF;

  -- grados
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'grados' AND policyname = 'grados_admin_all'
  ) THEN
      CREATE POLICY grados_admin_all ON public.grados FOR ALL TO authenticated USING ((select private.is_admin())) WITH CHECK ((select private.is_admin()));
  END IF;

  -- materias
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'materias' AND policyname = 'materias_admin_all'
  ) THEN
      CREATE POLICY materias_admin_all ON public.materias FOR ALL TO authenticated USING ((select private.is_admin())) WITH CHECK ((select private.is_admin()));
  END IF;
END
$$;
