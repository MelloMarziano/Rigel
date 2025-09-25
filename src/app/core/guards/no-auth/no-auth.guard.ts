import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Guard funcional para evitar que usuarios autenticados accedan a rutas públicas como login.
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Si el usuario ya está logueado, redirigir al dashboard
  if (authService.isLoggedIn()) {
    return router.parseUrl('/private/dashboard');
  }

  // Si no está logueado, permitir acceso a la ruta pública
  return true;
};
