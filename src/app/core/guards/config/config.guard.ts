import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  query,
  limit,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { ConfiguracionEmpresa } from '../../models/configuracion.model';
import { AuthService } from '../../services/auth/auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ConfigGuard implements CanActivate {
  constructor(
    private firestore: Firestore,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> {
    const configuracionRef = collection(this.firestore, 'configuracion');
    const q = query(configuracionRef, limit(1));

    return collectionData(q, { idField: 'id' }).pipe(
      take(1),
      map((data: any[]) => {
        if (data.length === 0) {
          // No hay configuración
          this.mostrarAlertaConfiguracion();
          this.router.navigate(['/private/settings']);
          return false;
        }

        const config: ConfiguracionEmpresa = data[0];

        // Validar campos requeridos
        const camposRequeridos = [
          'nombreRestaurante',
          'razonSocial',
          'cif',
          'telefono',
          'email',
          'direccion',
          'codigoPostal',
          'ciudad',
          'provincia',
        ];

        const camposFaltantes = camposRequeridos.filter(
          (campo) =>
            !config[campo as keyof ConfiguracionEmpresa] ||
            config[campo as keyof ConfiguracionEmpresa] === ''
        );

        if (camposFaltantes.length > 0) {
          this.mostrarAlertaConfiguracion();
          this.router.navigate(['/private/settings']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        // Error al cargar configuración
        this.mostrarAlertaConfiguracion();
        this.router.navigate(['/private/settings']);
        return of(false);
      })
    );
  }

  private mostrarAlertaConfiguracion(): void {
    Swal.fire({
      title: 'Configuración Requerida',
      html: `
        <div class="text-start">
          <p class="mb-3">Para acceder al sistema, primero debes completar la configuración de tu restaurante.</p>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Campos requeridos:</strong>
            <ul class="mt-2 mb-0">
              <li>Nombre del Restaurante</li>
              <li>Razón Social</li>
              <li>CIF</li>
              <li>Teléfono y Email</li>
              <li>Dirección completa</li>
            </ul>
          </div>
          <p class="mb-0 text-muted small">Si no puedes completar la configuración ahora, puedes cerrar sesión y volver más tarde.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ir a Configuración',
      cancelButtonText: 'Cerrar Sesión',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
        // Usuario eligió cerrar sesión
        this.cerrarSesion();
      }
      // Si confirma, ya se redirige a settings en el guard
    });
  }

  private cerrarSesion(): void {
    // Usar el servicio de autenticación para cerrar sesión correctamente
    this.authService.logout();
  }
}
