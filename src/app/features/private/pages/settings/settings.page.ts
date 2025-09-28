import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  doc,
  query,
  limit,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import {
  ConfiguracionEmpresa,
  InformacionSistema,
  PersonalizacionSistema,
} from '../../../../core/models/configuracion.model';
import { PersonalizacionService } from '../../../../core/services/personalizacion.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit, OnDestroy {
  pestanaActiva = 'general';
  configuracionForm!: FormGroup;
  customizationForm!: FormGroup;
  guardando = false;
  guardandoCustomization = false;
  configuracionExistente: ConfiguracionEmpresa | null = null;
  customizationExistente: PersonalizacionSistema | null = null;
  esPrimeraConfiguracion = false;
  modoEdicion = false;
  modoOscuroActivo = false;
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
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router,
    private customizationService: PersonalizacionService,
    private authService: AuthService
  ) {
    this.inicializarForm();
    this.inicializarCustomizationForm();
  }

  ngOnInit(): void {
    this.cargarConfiguracion();
    this.cargarCustomization();
    this.modoOscuroActivo =
      this.customizationService.obtenerPersonalizacionActual().modoOscuro ||
      false;
    this.checkRootPermissions();
    this.loadAppShutdownState();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private inicializarForm(): void {
    this.configuracionForm = this.fb.group({
      nombreRestaurante: ['', [Validators.required]],
      razonSocial: ['', [Validators.required]],
      cif: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      sitioWeb: [''],
      direccion: ['', [Validators.required]],
      codigoPostal: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
    });
  }

  private inicializarCustomizationForm(): void {
    this.customizationForm = this.fb.group({
      colorPrincipal: ['#dc3545'],
      colorSidebar: ['#122d44'],
      colorSidebarSecundario: ['#6e120b'],
      colorTextoSidebar: ['#ffffff'],
      colorHoverSidebar: ['#34495e'],
    });
  }

  private cargarConfiguracion(): void {
    const configuracionRef = collection(this.firestore, 'configuracion');
    const q = query(configuracionRef, limit(1));

    this.subscriptions.add(
      collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
        if (data.length > 0) {
          this.configuracionExistente = data[0];
          if (this.configuracionExistente) {
            this.configuracionForm.patchValue(this.configuracionExistente);
            this.esPrimeraConfiguracion = false;
            this.configuracionForm.disable(); // Deshabilitar campos cuando ya existe configuración
          }
        } else {
          this.esPrimeraConfiguracion = true;
          this.mostrarMensajePrimeraConfiguracion();
        }
      })
    );
  }

  cambiarPestana(pestana: string): void {
    if (this.esPrimeraConfiguracion && pestana !== 'general') {
      Swal.fire({
        title: 'Configuración Pendiente',
        text: 'Primero debes completar la configuración general de tu restaurante.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545',
      });
      return;
    }
    this.pestanaActiva = pestana;
  }

  activarEdicion(): void {
    this.modoEdicion = true;
    this.configuracionForm.enable();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.configuracionForm.disable();
    // Restaurar valores originales
    if (this.configuracionExistente) {
      this.configuracionForm.patchValue(this.configuracionExistente);
    }
  }

  private mostrarMensajePrimeraConfiguracion(): void {
    setTimeout(() => {
      Swal.fire({
        title: '¡Bienvenido a Rigel!',
        html: `
          <div class="text-start">
            <p class="mb-3">Para comenzar a usar el sistema, necesitamos que configures la información de tu restaurante.</p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Esta información se usará para:</strong>
              <ul class="mt-2 mb-0">
                <li>Generar albaranes y documentos</li>
                <li>Identificar tu negocio en el sistema</li>
                <li>Personalizar la experiencia</li>
              </ul>
            </div>
            <p class="mb-0"><strong>Una vez completada, podrás acceder a todas las funcionalidades del sistema.</strong></p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Comenzar Configuración',
        confirmButtonColor: '#007bff',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }, 500);
  }

  async guardarConfiguracion(): Promise<void> {
    if (!this.configuracionForm.valid) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos',
        'error'
      );
      return;
    }

    this.guardando = true;
    const formValue = this.configuracionForm.value;

    const configuracionData: ConfiguracionEmpresa = {
      ...formValue,
      fechaActualizacion: new Date(),
    };

    try {
      if (this.configuracionExistente?.id) {
        // Actualizar configuración existente
        const configRef = doc(
          this.firestore,
          'configuracion',
          this.configuracionExistente.id
        );
        await updateDoc(
          configRef,
          this.cleanObjectForFirebase(configuracionData)
        );

        this.modoEdicion = false;
        this.configuracionForm.disable();

        Swal.fire({
          title: '¡Configuración Actualizada!',
          text: 'Los cambios se han guardado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Crear nueva configuración
        configuracionData.fechaCreacion = new Date();
        const configuracionRef = collection(this.firestore, 'configuracion');
        const docRef = await addDoc(
          configuracionRef,
          this.cleanObjectForFirebase(configuracionData)
        );

        this.configuracionExistente = { ...configuracionData, id: docRef.id };

        Swal.fire({
          title: '¡Configuración Guardada!',
          text: 'La configuración inicial se ha creado correctamente. Ahora puedes acceder a todas las funcionalidades.',
          icon: 'success',
          confirmButtonText: 'Ir al Dashboard',
          confirmButtonColor: '#28a745',
        }).then(() => {
          this.router.navigate(['/private/dashboard']);
        });
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
    } finally {
      this.guardando = false;
    }
  }

  private cargarCustomization(): void {
    const customizationRef = collection(this.firestore, 'personalizacion');
    const q = query(customizationRef, limit(1));

    this.subscriptions.add(
      collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
        if (data.length > 0) {
          this.customizationExistente = data[0];
          if (this.customizationExistente) {
            this.customizationForm.patchValue(this.customizationExistente);
            this.customizationService.actualizarPersonalizacion(
              this.customizationExistente
            );
            // Actualizar el estado del switch después de cargar desde Firebase
            this.modoOscuroActivo =
              this.customizationExistente.modoOscuro || false;
          }
        } else {
          // Aplicar colores por defecto
          const coloresDefecto =
            this.customizationService.obtenerPersonalizacionActual();
          this.customizationForm.patchValue(coloresDefecto);
          // Actualizar el estado del switch con los valores por defecto
          this.modoOscuroActivo = coloresDefecto.modoOscuro || false;
        }
      })
    );
  }

  actualizarPreview(): void {
    // El preview se actualiza automáticamente con los bindings de Angular
    // Este método puede usarse para lógica adicional si es necesario
  }

  aplicarTema(tema: string): void {
    // Usar el servicio para aplicar el tema predefinido
    const temasValidos = [
      'default',
      'pink',
      'barbie',
      'blue',
      'green',
      'purple',
      'orange',
      'teal',
      'indigo',
    ];
    if (temasValidos.includes(tema)) {
      this.customizationService.aplicarTema(
        tema as
          | 'default'
          | 'pink'
          | 'barbie'
          | 'blue'
          | 'green'
          | 'purple'
          | 'orange'
          | 'teal'
          | 'indigo'
      );

      // Actualizar el formulario con los nuevos valores
      const personalizacionActual =
        this.customizationService.obtenerPersonalizacionActual();
      this.customizationForm.patchValue({
        colorPrincipal: personalizacionActual.colorPrincipal,
        colorSidebar: personalizacionActual.colorSidebar,
        colorSidebarSecundario: personalizacionActual.colorSidebarSecundario,
        colorTextoSidebar: personalizacionActual.colorTextoSidebar,
        colorHoverSidebar: personalizacionActual.colorHoverSidebar,
      });

      this.actualizarPreview();
    }
  }

  alternarModoOscuro(): void {
    this.customizationService.alternarModoOscuro();
    this.modoOscuroActivo =
      this.customizationService.obtenerPersonalizacionActual().modoOscuro ||
      false;
  }

  resetearColores(): void {
    this.aplicarTema('default');
  }

  private aplicarColoresAlSistema(): void {
    const colores = this.customizationForm.value;
    this.customizationService.actualizarPersonalizacion(colores);
  }

  async guardarPersonalizacion(): Promise<void> {
    this.guardandoCustomization = true;
    const formValue = this.customizationForm.value;

    const customizationData = {
      ...formValue,
      modoOscuro: this.modoOscuroActivo,
      fechaActualizacion: new Date(),
    };

    try {
      if (this.customizationExistente?.id) {
        // Actualizar personalización existente
        const customizationRef = doc(
          this.firestore,
          'personalizacion',
          this.customizationExistente.id
        );
        await updateDoc(
          customizationRef,
          this.cleanObjectForFirebase(customizationData)
        );
      } else {
        // Crear nueva personalización
        customizationData.fechaCreacion = new Date();
        const customizationRef = collection(this.firestore, 'personalizacion');
        const docRef = await addDoc(
          customizationRef,
          this.cleanObjectForFirebase(customizationData)
        );
        this.customizationExistente = {
          ...customizationData,
          id: docRef.id,
        };
      }

      // Aplicar los colores al sistema
      this.aplicarColoresAlSistema();

      Swal.fire({
        title: '¡Personalización Guardada!',
        text: 'Los colores se han aplicado correctamente al sistema.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar personalización:', error);
      Swal.fire('Error', 'No se pudo guardar la personalización', 'error');
    } finally {
      this.guardandoCustomization = false;
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

  private checkRootPermissions(): void {
    this.isRootUser = this.authService.hasPermission('app_shutdown');
    console.log('Verificando permisos ROOT:', this.isRootUser);
    console.log('Usuario actual:', this.authService.getCurrentUser());
  }

  private async loadAppShutdownState(): Promise<void> {
    try {
      const shutdownRef = collection(this.firestore, 'system_shutdown');
      const q = query(shutdownRef, limit(1));

      this.subscriptions.add(
        collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
          if (data.length > 0) {
            this.appShutdownEnabled = data[0].enabled || false;
            console.log('Estado de apagado cargado:', this.appShutdownEnabled);
          } else {
            this.appShutdownEnabled = false;
            console.log('No se encontró estado de apagado, estableciendo como false');
          }
        })
      );
    } catch (error) {
      console.error('Error al cargar estado de apagado:', error);
    }
  }

  async toggleAppShutdown(): Promise<void> {
    console.log('=== INICIO toggleAppShutdown ===');
    console.log('Estado actual appShutdownEnabled:', this.appShutdownEnabled);
    console.log('Usuario ROOT:', this.isRootUser);
    
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
    console.log('Acción determinada:', action);
    
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

    console.log('Resultado del modal SweetAlert2:', result);
    console.log('¿Modal confirmado?', result.isConfirmed);

    if (result.isConfirmed) {
      console.log('=== CONFIRMACIÓN RECIBIDA ===');
      try {
        const newState = !this.appShutdownEnabled;
        console.log('Nuevo estado calculado:', newState);
        
        const shutdownData = {
          enabled: newState,
          changedBy: this.authService.getCurrentUser()?.email || 'unknown',
          changedAt: new Date(),
          reason: newState
            ? 'Sistema desactivado por administrador ROOT'
            : 'Sistema reactivado por administrador ROOT',
        };

        console.log('Datos a guardar en Firebase:', shutdownData);

        // Crear nuevo documento directamente (simplificado)
        const shutdownRef = collection(this.firestore, 'system_shutdown');
        console.log('Creando nuevo documento...');
        const docRef = await addDoc(shutdownRef, this.cleanObjectForFirebase(shutdownData));
        console.log('Nuevo documento creado exitosamente con ID:', docRef.id);

        // Actualizar el estado local inmediatamente después de guardar en Firebase
        this.appShutdownEnabled = newState;
        console.log('Estado actualizado localmente:', this.appShutdownEnabled);

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
          // Si se desactiva el sistema, cerrar sesión después de un momento
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }, 2500);
        }
      } catch (error) {
        console.error('=== ERROR AL GUARDAR EN FIREBASE ===');
        console.error('Error completo:', error);
        console.error('Tipo de error:', typeof error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
        
        Swal.fire({
          title: 'Error',
          text: `Error al ${this.appShutdownEnabled ? 'activar' : 'desactivar'} el sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          icon: 'error',
        });
      }
    } else {
      console.log('=== MODAL CANCELADO ===');
    }
  }
}
