import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api.constants';
import {
  AcademicLevel,
  AdminDashboardPayload,
  AdminInstitutionPayload,
  FamilyPortalPayload,
  MessagePayload,
  StudentPortalPayload,
  TeacherDashboardPayload,
  TeacherGradesPayload,
  TeacherImportContextPayload,
  TeacherProgress,
  UserRow,
  GradeEntryInput,
} from './models';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);

  adminDashboard(): Observable<AdminDashboardPayload> {
    return this.http.get<AdminDashboardPayload>(`${API_URL}/portal/admin/dashboard`);
  }

  adminUsers(): Observable<UserRow[]> {
    return this.http.get<UserRow[]>(`${API_URL}/portal/admin/users`);
  }

  adminAcademicLevels(): Observable<AcademicLevel[]> {
    return this.http.get<AcademicLevel[]>(`${API_URL}/portal/admin/academic-levels`);
  }

  adminSupervision(): Observable<TeacherProgress[]> {
    return this.http.get<TeacherProgress[]>(`${API_URL}/portal/admin/supervision`);
  }

  adminInstitution(): Observable<AdminInstitutionPayload> {
    return this.http.get<AdminInstitutionPayload>(`${API_URL}/portal/admin/institution`);
  }

  teacherDashboard(): Observable<TeacherDashboardPayload> {
    return this.http.get<TeacherDashboardPayload>(`${API_URL}/portal/teacher/dashboard`);
  }

  teacherGrades(assignmentId?: number): Observable<TeacherGradesPayload> {
    let params = new HttpParams();
    if (assignmentId !== undefined && assignmentId !== null) {
      params = params.set('assignmentId', assignmentId);
    }

    return this.http.get<TeacherGradesPayload>(`${API_URL}/portal/teacher/grades`, { params });
  }

  saveTeacherGrades(assignmentId: number, rows: GradeEntryInput[]): Observable<MessagePayload> {
    return this.http.put<MessagePayload>(`${API_URL}/portal/teacher/grades`, {
      assignmentId,
      rows,
    });
  }

  teacherImportContext(): Observable<TeacherImportContextPayload> {
    return this.http.get<TeacherImportContextPayload>(`${API_URL}/portal/teacher/import-context`);
  }

  studentPortal(): Observable<StudentPortalPayload> {
    return this.http.get<StudentPortalPayload>(`${API_URL}/portal/student`);
  }

  familyPortal(): Observable<FamilyPortalPayload> {
    return this.http.get<FamilyPortalPayload>(`${API_URL}/portal/family`);
  }
}
