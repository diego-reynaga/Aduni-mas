import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import {
  EntityId,
  ErrorImportacionNotas,
  ImportacionNotasDetalle,
  ImportacionNotasHistorial,
  RegistroNotasTrimestrePreviewResponse,
  ResultadoImportacionTrimestre,
  TrimestreImportacion,
} from './models';
import { supabase } from './supabase.client';

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

function throwIfError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

@Injectable({ providedIn: 'root' })
export class NotasService {
  previewRegistroNotasTrimestre(
    file: File,
    trimestre: TrimestreImportacion,
    assignmentId?: EntityId | null,
  ): Observable<RegistroNotasTrimestrePreviewResponse> {
    return from(this.invokeImport(file, trimestre, assignmentId, 'preview')) as Observable<RegistroNotasTrimestrePreviewResponse>;
  }

  confirmarRegistroNotasTrimestre(
    file: File,
    trimestre: TrimestreImportacion,
    assignmentId?: EntityId | null,
  ): Observable<ResultadoImportacionTrimestre> {
    return from(this.invokeImport(file, trimestre, assignmentId, 'confirmar')) as Observable<ResultadoImportacionTrimestre>;
  }

  listarImportacionesNotas(): Observable<ImportacionNotasHistorial[]> {
    return from(
      supabase.from('importaciones_notas')
        .select('*,profiles!importaciones_notas_usuario_id_fkey(username)')
        .order('created_at', { ascending: false }),
    ).pipe(map((result) => (throwIfError(result as never) as any[]).map((row) => this.toHistory(row))));
  }

  obtenerImportacionNotas(id: EntityId): Observable<ImportacionNotasDetalle> {
    return from(
      supabase.from('importaciones_notas')
        .select('*,profiles!importaciones_notas_usuario_id_fkey(username)')
        .eq('id', id)
        .single(),
    ).pipe(map((result) => {
      const row = throwIfError(result as never) as any;
      return {
        idImportacion: row.id,
        nombreArchivo: row.nombre_archivo,
        trimestre: row.trimestre,
        metadata: {
          anio: row.anio,
          nivel: row.nivel ?? '',
          institucion: row.institucion ?? '',
          lugar: row.lugar ?? '',
          areaCurricular: row.area_curricular ?? '',
          docente: row.docente_excel ?? '',
          grado: row.grado ?? '',
          seccion: row.seccion ?? '',
        },
        usuarioResponsable: row.profiles?.username ?? 'sistema',
        fechaImportacion: new Date(row.created_at).toLocaleString('es-PE'),
        estado: row.estado,
        totalFilas: row.total_registros,
        totalCorrectas: row.registros_validos,
        totalConError: row.registros_observados,
        observacion: row.detalle ?? '',
      };
    }));
  }

  listarErroresImportacionNotas(id: EntityId): Observable<ErrorImportacionNotas[]> {
    return from(
      supabase.from('errores_importacion_notas').select('*').eq('importacion_id', id).order('fila_excel'),
    ).pipe(map((result) => (throwIfError(result as never) as any[]).map((row) => ({
      filaExcel: row.fila_excel,
      estudianteTexto: row.estudiante_texto,
      campo: row.campo ?? '',
      descripcionError: row.descripcion,
      critico: row.critico,
    }))));
  }

  private async invokeImport(
    file: File,
    trimestre: TrimestreImportacion,
    assignmentId: EntityId | null | undefined,
    modo: 'preview' | 'confirmar',
  ): Promise<unknown> {
    if (!assignmentId) throw new Error('Seleccione una asignación docente.');
    if (!file.name.toLocaleLowerCase('es').endsWith('.xlsx')) {
      throw new Error('Seleccione un archivo de Excel con extensión .xlsx.');
    }
    if (file.size <= 0) throw new Error('El archivo seleccionado está vacío.');
    if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error('El archivo debe pesar como máximo 10 MB.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('trimestre', trimestre);
    formData.append('assignmentId', assignmentId);
    formData.append('modo', modo);
    const { data, error } = await supabase.functions.invoke('importar-notas-trimestre', { body: formData });
    if (error) {
      const context = (error as { context?: Response }).context;
      if (context) {
        let payload: { message?: string; error?: string; details?: string } | null = null;
        try {
          payload = await context.clone().json() as { message?: string; error?: string; details?: string };
        } catch {
          try {
            const text = (await context.clone().text()).trim();
            if (text) payload = { message: text };
          } catch { /* The gateway did not return a readable body. */ }
        }
        if (payload?.message) throw new Error(payload.message);
        if (payload?.error) throw new Error(payload.error);
        if (payload?.details) throw new Error(payload.details);
      }
      throw new Error(error.message || 'No se pudo ejecutar la importación.');
    }
    if (data?.message && !data?.metadata && !data?.idImportacion) throw new Error(data.message);
    return data;
  }

  private toHistory(row: any): ImportacionNotasHistorial {
    return {
      idImportacion: row.id,
      nombreArchivo: row.nombre_archivo,
      trimestre: row.trimestre,
      anio: row.anio,
      areaCurricular: row.area_curricular ?? '',
      grado: row.grado ?? '',
      seccion: row.seccion ?? '',
      docente: row.docente_excel ?? '',
      usuarioResponsable: row.profiles?.username ?? 'sistema',
      fechaImportacion: new Date(row.created_at).toLocaleString('es-PE'),
      estado: row.estado,
      totalFilas: row.total_registros,
      totalCorrectas: row.registros_validos,
      totalConError: row.registros_observados,
      observacion: row.detalle ?? '',
    };
  }
}
