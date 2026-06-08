import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  normalizeRole,
  primaryRole,
  RoleName,
  Session,
} from './models';
import { API_URL } from './api.constants';

const STORAGE_KEY = 'aduni-plus-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly sessionState = signal<Session | null>(this.readStoredSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.token));
  readonly activeRole = computed(() => this.sessionState()?.preferredRole ?? null);

  login(request: LoginRequest): Observable<Session> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, request).pipe(
      map((response) => this.createSession(response)),
      tap((session) => this.storeSession(session)),
    );
  }

  switchRole(role: RoleName): void {
    const session = this.sessionState();
    if (!session) {
      return;
    }

    const canSwitch = session.roles.includes(role) || session.roles.includes('ADMINISTRADOR');
    if (!canSwitch) {
      return;
    }

    this.storeSession({
      ...session,
      preferredRole: role,
    });
  }

  logout(): void {
    this.sessionState.set(null);
    if (this.browser) {
      localStorage.removeItem(STORAGE_KEY);
    }
    void this.router.navigate(['/login']);
  }

  hasAnyRole(roles: RoleName[]): boolean {
    const session = this.sessionState();
    if (!session) {
      return false;
    }

    return roles.some((role) => session.roles.includes(role));
  }

  availableRoles(): RoleName[] {
    const session = this.sessionState();
    if (!session) {
      return [];
    }

    return session.roles;
  }

  private createSession(response: LoginResponse): Session {
    const roles = response.roles.map(normalizeRole);

    return {
      token: response.token,
      username: response.username,
      roles,
      preferredRole: primaryRole(roles),
      issuedAt: new Date().toISOString(),
    };
  }

  private storeSession(session: Session): void {
    this.sessionState.set(session);
    if (this.browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  private readStoredSession(): Session | null {
    if (!this.browser) {
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Session;
      return {
        ...parsed,
        roles: parsed.roles.map(normalizeRole),
        preferredRole: normalizeRole(parsed.preferredRole),
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
