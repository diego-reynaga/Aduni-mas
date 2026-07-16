import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    // Las rutas protegidas dependen de la sesión JWT almacenada en el navegador.
    // El renderizado cliente evita que SSR redirija erróneamente al login al recargar.
    renderMode: RenderMode.Client
  }
];
