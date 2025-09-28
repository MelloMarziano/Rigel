import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  limit,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Guard funcional para verificar si la aplicación está desactivada.
 * Solo permite acceso a usuarios ROOT cuando la app está desactivada.
 */
export const appShutdownGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const firestore = inject(Firestore);
  const authService = inject(AuthService);

  console.log('=== APP SHUTDOWN GUARD EJECUTÁNDOSE ===');
  console.log('Ruta solicitada:', state.url);

  // Verificar si el usuario está autenticado
  if (!authService.isLoggedIn()) {
    console.log('Usuario no autenticado, redirigiendo a login');
    return router.parseUrl('/public/sign-in');
  }

  const currentUser = authService.getCurrentUser();
  console.log('Usuario actual:', currentUser);
  console.log('¿Es usuario ROOT?', currentUser?.rol === 'ROOT');

  const shutdownRef = collection(firestore, 'system_shutdown');
  const q = query(shutdownRef, limit(1));

  return collectionData(q, { idField: 'id' }).pipe(
    take(1),
    map((data: any[]) => {
      console.log('Datos de shutdown obtenidos:', data);
      
      // Si no hay datos de shutdown, permitir acceso
      if (data.length === 0) {
        console.log('No hay datos de shutdown, permitiendo acceso');
        return true;
      }

      const shutdownData = data[0];
      const isShutdown = shutdownData.enabled || false;
      console.log('¿Sistema desactivado?', isShutdown);

      // Si la app no está desactivada, permitir acceso
      if (!isShutdown) {
        console.log('Sistema activo, permitiendo acceso');
        return true;
      }

      // Si la app está desactivada, solo permitir acceso a usuarios ROOT
      const user = authService.getCurrentUser();
      const isRootUser = user?.rol === 'ROOT' || authService.hasPermission('app_shutdown');
      console.log('¿Usuario ROOT con acceso?', isRootUser);

      if (isRootUser) {
        console.log('Usuario ROOT detectado, permitiendo acceso');
        return true;
      }

      // Redirigir a página de sistema desactivado
      console.log('Sistema desactivado y usuario sin permisos, redirigiendo a system-shutdown');
      console.log('URL de redirección:', '/public/system-shutdown');
      return router.parseUrl('/public/system-shutdown');
    }),
    catchError((error) => {
      // En caso de error, permitir acceso por defecto
      console.error('Error verificando estado de shutdown:', error);
      return of(true);
    })
  );
};