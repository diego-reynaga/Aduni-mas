alter table public.notas
  alter column valor type numeric using valor::numeric;

alter table public.calificacion_detalle_trimestre
  alter column valor_nota type numeric using valor_nota::numeric;

alter table public.calificacion_competencia_trimestre
  alter column promedio_competencia type numeric using promedio_competencia::numeric;