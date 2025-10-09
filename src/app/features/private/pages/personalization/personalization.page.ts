import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { PersonalizacionService } from '../../../../core/services/personalizacion.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personalization-page',
  templateUrl: './personalization.page.html',
  styleUrls: ['./personalization.page.scss'],
})
export class PersonalizationPage implements OnInit {
  customizationForm!: FormGroup;
  guardandoCustomization = false;
  customizationExistente: any = null;
  modoOscuroActivo = false;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private customizationService: PersonalizacionService,
    private authService: AuthService
  ) {
    this.inicializarCustomizationForm();
  }

  ngOnInit(): void {
    this.cargarCustomization();
    this.cargarPreferenciasModoOscuro();
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

  private async cargarPreferenciasModoOscuro(): Promise<void> {
    const modoOscuroLocal = localStorage.getItem('modoOscuro');
    if (modoOscuroLocal !== null) {
      this.modoOscuroActivo = JSON.parse(modoOscuroLocal);
    } else {
      try {
        const user = this.authService.getCurrentUser();
        if (user?.uid) {
          const userRef = doc(this.firestore, 'usuarios', user.uid);
          const userDoc = await import('@angular/fire/firestore').then((m) =>
            m.getDoc(userRef)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            this.modoOscuroActivo = userData['modoOscuro'] || false;
            localStorage.setItem(
              'modoOscuro',
              JSON.stringify(this.modoOscuroActivo)
            );
          }
        }
      } catch (error) {
        console.log('No se pudo cargar preferencia de Firebase:', error);
        this.modoOscuroActivo = false;
      }
    }

    if (this.modoOscuroActivo) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  private async cargarCustomization(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (user?.uid) {
        const userRef = doc(this.firestore, 'usuarios', user.uid);
        const userDoc = await import('@angular/fire/firestore').then((m) =>
          m.getDoc(userRef)
        );

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const personalizacion = userData['personalizacion'];

          if (personalizacion) {
            this.customizationExistente = personalizacion;
            this.customizationForm.patchValue(personalizacion);
            this.customizationService.actualizarPersonalizacion(
              personalizacion
            );
          } else {
            const coloresDefecto =
              this.customizationService.obtenerPersonalizacionActual();
            this.customizationForm.patchValue(coloresDefecto);
          }
        }
      }
    } catch (error) {
      console.log('Error al cargar personalización:', error);
      const coloresDefecto =
        this.customizationService.obtenerPersonalizacionActual();
      this.customizationForm.patchValue(coloresDefecto);
    }
  }

  actualizarPreview(): void {
    const colores = this.customizationForm.value;
    const nuevaPersonalizacion = {
      ...colores,
      modoOscuro: this.modoOscuroActivo,
    };
    this.customizationService.actualizarPersonalizacion(nuevaPersonalizacion);
  }

  aplicarTema(tema: string): void {
    const temas: { [key: string]: any } = {
      default: {
        colorPrincipal: '#dc3545',
        colorSidebar: '#122d44',
        colorSidebarSecundario: '#6e120b',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#34495e',
      },
      ocean: {
        colorPrincipal: '#0077be',
        colorSidebar: '#0077be',
        colorSidebarSecundario: '#00a8cc',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#005a8b',
      },
      sunset: {
        colorPrincipal: '#ff6b35',
        colorSidebar: '#ff6b35',
        colorSidebarSecundario: '#f7931e',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#e55a2b',
      },
      forest: {
        colorPrincipal: '#2d5016',
        colorSidebar: '#2d5016',
        colorSidebarSecundario: '#3e7b27',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#1e3a0f',
      },
      lavender: {
        colorPrincipal: '#667eea',
        colorSidebar: '#667eea',
        colorSidebarSecundario: '#764ba2',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#5a6fd8',
      },
      cherry: {
        colorPrincipal: '#eb3349',
        colorSidebar: '#eb3349',
        colorSidebarSecundario: '#f45c43',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#d42c40',
      },
      midnight: {
        colorPrincipal: '#2c3e50',
        colorSidebar: '#2c3e50',
        colorSidebarSecundario: '#34495e',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#1a252f',
      },
      aurora: {
        colorPrincipal: '#00c6ff',
        colorSidebar: '#00c6ff',
        colorSidebarSecundario: '#0072ff',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#00a8d6',
      },
      cosmic: {
        colorPrincipal: '#8360c3',
        colorSidebar: '#8360c3',
        colorSidebarSecundario: '#2ebf91',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#7451b3',
      },
      tropical: {
        colorPrincipal: '#f093fb',
        colorSidebar: '#f093fb',
        colorSidebarSecundario: '#f5576c',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#ee7ff9',
      },
      volcano: {
        colorPrincipal: '#ff9a9e',
        colorSidebar: '#ff9a9e',
        colorSidebarSecundario: '#fecfef',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#ff8a8f',
      },
      emerald: {
        colorPrincipal: '#11998e',
        colorSidebar: '#11998e',
        colorSidebarSecundario: '#38ef7d',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#0e8078',
      },
      royal: {
        colorPrincipal: '#141e30',
        colorSidebar: '#141e30',
        colorSidebarSecundario: '#243b55',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#0a1118',
      },
      peach: {
        colorPrincipal: '#ed4264',
        colorSidebar: '#ed4264',
        colorSidebarSecundario: '#ffedbc',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#d63555',
      },
      mint: {
        colorPrincipal: '#00b09b',
        colorSidebar: '#00b09b',
        colorSidebarSecundario: '#96c93d',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#009688',
      },
      neon: {
        colorPrincipal: '#b92b27',
        colorSidebar: '#b92b27',
        colorSidebarSecundario: '#1565c0',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#9a231f',
      },
      candy: {
        colorPrincipal: '#d3959b',
        colorSidebar: '#d3959b',
        colorSidebarSecundario: '#bfe6ba',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#c27f86',
      },
      galaxy: {
        colorPrincipal: '#2e1437',
        colorSidebar: '#2e1437',
        colorSidebarSecundario: '#948e99',
        colorTextoSidebar: '#ffffff',
        colorHoverSidebar: '#1f0d25',
      },
    };

    if (temas[tema]) {
      this.customizationForm.patchValue(temas[tema]);
      this.actualizarPreview();
    }
  }

  async alternarModoOscuro(): Promise<void> {
    this.modoOscuroActivo = !this.modoOscuroActivo;

    localStorage.setItem('modoOscuro', JSON.stringify(this.modoOscuroActivo));

    if (this.modoOscuroActivo) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    try {
      const user = this.authService.getCurrentUser();
      if (user?.uid) {
        const userRef = doc(this.firestore, 'usuarios', user.uid);
        await updateDoc(userRef, {
          modoOscuro: this.modoOscuroActivo,
          fechaActualizacionPreferencias: new Date(),
        });
      }
    } catch (error) {
      console.log('No se pudo guardar en Firebase:', error);
    }
  }

  resetearColores(): void {
    this.aplicarTema('default');
  }

  private aplicarColoresAlSistema(): void {
    const colores = this.customizationForm.value;
    const nuevaPersonalizacion = {
      ...colores,
      modoOscuro: this.modoOscuroActivo,
    };
    this.customizationService.actualizarPersonalizacion(nuevaPersonalizacion);
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
      const user = this.authService.getCurrentUser();
      if (user?.uid) {
        const userRef = doc(this.firestore, 'usuarios', user.uid);
        await updateDoc(userRef, {
          personalizacion: this.cleanObjectForFirebase(customizationData),
          modoOscuro: this.modoOscuroActivo,
          fechaActualizacionPersonalizacion: new Date(),
        });

        this.customizationExistente = customizationData;
      }

      this.aplicarColoresAlSistema();

      Swal.fire({
        title: '¡Personalización Guardada!',
        text: 'Los colores y preferencias se han guardado correctamente en tu cuenta.',
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
}
