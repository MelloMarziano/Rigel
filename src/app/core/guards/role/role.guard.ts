import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Guard funcional para validar el rol y permisos del usuario según la metadata de la ruta.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Verificar si está logueado
  if (!authService.isLoggedIn()) {
    return router.parseUrl('/public/sign-in');
  }

  const user = authService.getCurrentUser();

  // Lista de roles permitidos para esta ruta
  const expectedRoles: string[] = route.data['roles'];
  // Lista de permisos requeridos para esta ruta
  const requiredPermissions: string[] = route.data['permissions'];

  // Si no hay restricciones específicas, permitir acceso
  if (!expectedRoles && !requiredPermissions) {
    return true;
  }

  // Verificar roles
  if (expectedRoles && expectedRoles.length > 0) {
    if (!expectedRoles.includes(user.rol)) {
      return router.parseUrl('/private/access-denied');
    }
  }

  // Verificar permisos específicos
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      authService.hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return router.parseUrl('/private/access-denied');
    }
  }

  return true;
};
