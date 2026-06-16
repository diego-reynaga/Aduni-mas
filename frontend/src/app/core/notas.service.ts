import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api.constants';
import {
  ErrorImportacionNotas,
  ExcelImportResult,
  ImportacionNotasDetalle,
  ImportacionNotasHistorial,
  RegistroNotasPreviewResponse,
  RegistroNotasTrimestrePreviewResponse,
  ResultadoImportacionNotas,
  ResultadoImportacionTrimestre,
  TrimestreImportacion,
} from './models';

@Injectable({ providedIn: 'root' })
export class NotasService {
  private readonly http = inject(HttpClient);

  listar(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/notas`);
  }

  importarExcel(assignmentId: number, file: File): Observable<ExcelImportResult> {
    const formData = new FormData();
    formData.append('assignmentId', String(assignmentId));
    formData.append('file', file);

    return this.http.post<ExcelImportResult>(`${API_URL}/portal/teacher/import-excel`, formData);
  }

  previewRegistroNotas(file: File): Observable<RegistroNotasPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<RegistroNotasPreviewResponse>(`${API_URL}/notas/importar-excel/preview`, formData);
  }

  confirmarRegistroNotas(file: File): Observable<ResultadoImportacionNotas> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ResultadoImportacionNotas>(`${API_URL}/notas/importar-excel/confirmar`, formData);
  }

  previewRegistroNotasTrimestre(
    file: File,
    trimestre: TrimestreImportacion,
    assignmentId?: number | null,
    cursoId?: number | null,
  ): Observable<RegistroNotasTrimestrePreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('trimestre', trimestre);
    if (assignmentId !== undefined && assignmentId !== null) {
      formData.append('assignmentId', String(assignmentId));
    }
    if (cursoId !== undefined && cursoId !== null) {
      formData.append('cursoId', String(cursoId));
    }

    return this.http.post<RegistroNotasTrimestrePreviewResponse>(`${API_URL}/notas/importar-trimestre/preview`, formData);
  }

  confirmarRegistroNotasTrimestre(
    file: File,
    trimestre: TrimestreImportacion,
    assignmentId?: number | null,
    cursoId?: number | null,
  ): Observable<ResultadoImportacionTrimestre> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('trimestre', trimestre);
    if (assignmentId !== undefined && assignmentId !== null) {
      formData.append('assignmentId', String(assignmentId));
    }
    if (cursoId !== undefined && cursoId !== null) {
      formData.append('cursoId', String(cursoId));
    }

    return this.http.post<ResultadoImportacionTrimestre>(`${API_URL}/notas/importar-trimestre/confirmar`, formData);
  }

  listarImportacionesNotas(): Observable<ImportacionNotasHistorial[]> {
    return this.http.get<ImportacionNotasHistorial[]>(`${API_URL}/notas/importaciones`);
  }

  obtenerImportacionNotas(id: number): Observable<ImportacionNotasDetalle> {
    return this.http.get<ImportacionNotasDetalle>(`${API_URL}/notas/importaciones/${id}`);
  }

  listarErroresImportacionNotas(id: number): Observable<ErrorImportacionNotas[]> {
    return this.http.get<ErrorImportacionNotas[]>(`${API_URL}/notas/importaciones/${id}/errores`);
  }
}
