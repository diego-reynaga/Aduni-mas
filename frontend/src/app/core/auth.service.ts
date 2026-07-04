import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { LoginRequest, RoleName, Session } from './models';
import { supabase } from './supabase.client';

type ProfileRow = {
  id: string;
  persona_id: string;
  rol: RoleName;
  username: string;
  activo: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly sessionState = signal<Session | null>(null);
  private initialized = false;
  private readonly initialization: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.token));
  readonly activeRole = computed(() => this.sessionState()?.preferredRole ?? null);

  constructor() {
    this.initialization = this.restoreSession();
    supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) {
        this.sessionState.set(null);
        return;
      }
      void this.loadProfile(authSession.access_token).catch(() => this.sessionState.set(null));
    });
  }

  login(request: LoginRequest): Observable<Session> {
    return from(this.signIn(request));
  }

  async ensureInitialized(): Promise<void> {
    await this.initialization;
  }

  switchRole(role: RoleName): void {
    const session = this.sessionState();
    if (session?.roles.includes(role)) {
      this.sessionState.set({ ...session, preferredRole: role });
    }
  }

  logout(): void {
    this.sessionState.set(null);
    void supabase.auth.signOut().finally(() => this.router.navigate(['/login']));
  }

  hasAnyRole(roles: RoleName[]): boolean {
    return roles.some((role) => this.sessionState()?.roles.includes(role));
  }

  availableRoles(): RoleName[] {
    return this.sessionState()?.roles ?? [];
  }

  private async restoreSession(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) await this.loadProfile(data.session.access_token);
    } finally {
      this.initialized = true;
    }
  }

  private async signIn(request: LoginRequest): Promise<Session> {
    const email = request.username.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: request.password });
    if (error || !data.session) throw error ?? new Error('Supabase Auth no devolvió una sesión.');
    return this.loadProfile(data.session.access_token);
  }

  private async loadProfile(accessToken: string): Promise<Session> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,persona_id,rol,username,activo')
      .single<ProfileRow>();
    if (error || !data || !data.activo) {
      await supabase.auth.signOut();
      throw error ?? new Error('El perfil está inactivo o no está configurado.');
    }
    const session: Session = {
      token: accessToken,
      userId: data.id,
      personaId: data.persona_id,
      username: data.username,
      roles: [data.rol],
      preferredRole: data.rol,
      issuedAt: new Date().toISOString(),
    };
    this.sessionState.set(session);
    return session;
  }
}
