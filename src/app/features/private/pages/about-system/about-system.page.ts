import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  limit,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { InformacionSistema } from '../../../../core/models/configuracion.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-about-system-page',
  templateUrl: './about-system.page.html',
  styleUrls: ['./about-system.page.scss'],
})
export class AboutSystemPage implements OnInit, OnDestroy {
  appShutdownEnabled = false;
  isRootUser = false;

  infoSistema: InformacionSistema = {
    nombre: 'Rigel',
    version: '1.0.0',
    descripcion: 'Sistema de Gestión Integral para Restaurantes',
    fechaLanzamiento: 'Septiembre 2025',
    equipo: {
      ceo: {
        nombre: 'Eliu Ortega',
        telefono: '829 515 1616',
        pais: 'República Dominicana',
        bandera: '🇩🇴',
      },
      cto: {
        nombre: 'Alberto Ortega',
        telefono: '673 90 59 91',
        pais: 'España',
        bandera: '🇪🇸',
      },
      designer: {
        nombre: 'Diana Stoica',
        pais: 'Rumania',
        bandera: '🇷🇴',
      },
    },
  };

  private subscriptions = new Subscription();

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkRootPermissions();
    this.loadAppShutdownState();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private checkRootPermissions(): void {
    this.isRootUser = this.authService.hasPermission('app_shutdown');
  }

  private async loadAppShutdownState(): Promise<void> {
    try {
      const shutdownRef = collection(this.firestore, 'system_shutdown');
      const q = query(shutdownRef, limit(1));

      this.subscriptions.add(
        collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
          if (data.length > 0) {
            this.appShutdownEnabled = data[0].enabled || false;
          } else {
            this.appShutdownEnabled = false;
          }
        })
      );
    } catch (error) {
      console.error('Error al cargar estado de apagado:', error);
    }
  }

  async toggleAppShutdown(): Promise<void> {
    if (!this.isRootUser) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Solo los usuarios ROOT pueden controlar el apagado del sistema.',
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const action = this.appShutdownEnabled ? 'activar' : 'desactivar';

    const result = await Swal.fire({
      title: `¿${action === 'activar' ? 'Activar' : 'Desactivar'} Sistema?`,
      html: `
        <div class="text-start">
          <p class="mb-3">${
            action === 'activar'
              ? 'Está a punto de <strong>activar</strong> el sistema. Los usuarios podrán acceder normalmente.'
              : 'Está a punto de <strong>desactivar</strong> el sistema. Esto impedirá que otros usuarios accedan hasta que se reactive.'
          }</p>
          ${
            action === 'desactivar'
              ? `
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Importante:</strong> Los usuarios deberán contactar con el soporte técnico para reactivar el acceso.
            </div>
            <div class="alert alert-info">
              <i class="bi bi-person-badge me-2"></i>
              <strong>Contacto de Soporte:</strong><br>
              Alberto Ortega - CTO<br>
              Teléfono: +34 673 90 59 91
            </div>
          `
              : ''
          }
        </div>
      `,
      icon: action === 'activar' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText:
        action === 'activar' ? 'Sí, Activar' : 'Sí, Desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: action === 'activar' ? '#28a745' : '#dc3545',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const newState = !this.appShutdownEnabled;

        const shutdownData = {
          enabled: newState,
          changedBy: this.authService.getCurrentUser()?.email || 'unknown',
          changedAt: new Date(),
          reason: newState
            ? 'Sistema desactivado por administrador ROOT'
            : 'Sistema reactivado por administrador ROOT',
        };

        const shutdownRef = collection(this.firestore, 'system_shutdown');
        await addDoc(shutdownRef, this.cleanObjectForFirebase(shutdownData));

        this.appShutdownEnabled = newState;

        Swal.fire({
          title: '¡Estado Actualizado!',
          text: `El sistema ha sido ${
            newState ? 'desactivado' : 'activado'
          } correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        if (newState) {
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }, 2500);
        }
      } catch (error) {
        console.error('Error al guardar en Firebase:', error);
        Swal.fire({
          title: 'Error',
          text: `Error al ${
            this.appShutdownEnabled ? 'activar' : 'desactivar'
          } el sistema`,
          icon: 'error',
        });
      }
    }
  }

  private cleanObjectForFirebase(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (obj[key] instanceof Date) {
          cleaned[key] = obj[key];
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          cleaned[key] = this.cleanObjectForFirebase(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  }
}
