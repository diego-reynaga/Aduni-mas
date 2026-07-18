import { ErrorImportacionNotas } from './models';

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function suggestedAction(error: ErrorImportacionNotas): string {
  if (error.critico) return 'Corrija la estructura o los datos generales del archivo y vuelva a cargarlo.';
  if (error.campo === 'estudiante') return 'Verifique que el estudiante tenga matrícula activa en el curso y periodo seleccionados.';
  if (/nota|[A-Z]{1,3}/.test(error.campo)) return 'Corrija el valor de la celda: solo se permiten notas numéricas entre 0 y 20.';
  return 'Revise el dato indicado y vuelva a previsualizar el archivo.';
}

export function downloadImportErrorsReport(
  errors: ErrorImportacionNotas[],
  filename: string,
  reportTitle = 'REPORTE DE OBSERVACIONES DE IMPORTACIÓN',
): void {
  const generatedAt = new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
  const criticalCount = errors.filter((error) => error.critico).length;
  const rows = errors.map((error, index) => [
    index + 1,
    error.critico ? 'CRÍTICA' : 'OBSERVACIÓN',
    error.filaExcel ?? '—',
    error.estudianteTexto ?? '—',
    error.campo || 'General',
    error.descripcionError,
    suggestedAction(error),
  ]);
  const csv = [
    ['sep=;'],
    [reportTitle],
    ['Generado', generatedAt],
    ['Total de observaciones', errors.length],
    ['Errores críticos', criticalCount],
    [],
    ['N°', 'Nivel', 'Fila Excel', 'Estudiante', 'Campo', 'Descripción', 'Acción recomendada'],
    ...rows,
  ].map((columns) => columns.length === 1 && columns[0] === 'sep=;'
    ? 'sep=;'
    : columns.map(csvCell).join(';'))
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
