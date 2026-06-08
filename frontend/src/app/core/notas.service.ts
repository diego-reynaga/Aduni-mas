import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api.constants';
import { ExcelImportResult } from './models';

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
}
