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
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ConfigGuard implements CanActivate {
  constructor(private firestore: Firestore, private router: Router) {}

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
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Ir a Configuración',
      confirmButtonColor: '#dc3545',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }
}
