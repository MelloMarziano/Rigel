import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Guard funcional para validar el rol del usuario según la metadata de la ruta.
 * Requiere que el rol esté almacenado en localStorage con la clave 'role'.
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Lista de roles permitidos para esta ruta
    const expectedRoles: string[] = route.data['roles'];

    // Rol actual del usuario desde localStorage
    const userRole = localStorage.getItem('role');

    // Validación
    if (userRole && expectedRoles.includes(userRole)) {
        return true;
    }

    // Redirigir si no tiene el rol adecuado
    return router.parseUrl('/unauthorized');
};
