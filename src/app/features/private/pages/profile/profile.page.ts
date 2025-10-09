import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { ConfiguracionEmpresa } from '../../../../core/models/configuracion.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  configuracionForm!: FormGroup;
  guardando = false;
  configuracionExistente: ConfiguracionEmpresa | null = null;
  esPrimeraConfiguracion = false;
  modoEdicion = false;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.inicializarForm();
  }

  ngOnInit(): void {
    this.cargarConfiguracion();
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
            this.configuracionForm.disable();
          }
        } else {
          this.esPrimeraConfiguracion = true;
          this.mostrarMensajePrimeraConfiguracion();
        }
      })
    );
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

  activarEdicion(): void {
    this.modoEdicion = true;
    this.configuracionForm.enable();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.configuracionForm.disable();
    if (this.configuracionExistente) {
      this.configuracionForm.patchValue(this.configuracionExistente);
    }
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
          title: '¡Perfil Actualizado!',
          text: 'Los cambios se han guardado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        configuracionData.fechaCreacion = new Date();
        const configuracionRef = collection(this.firestore, 'configuracion');
        const docRef = await addDoc(
          configuracionRef,
          this.cleanObjectForFirebase(configuracionData)
        );

        this.configuracionExistente = { ...configuracionData, id: docRef.id };

        Swal.fire({
          title: '¡Perfil Creado!',
          text: 'La configuración inicial se ha creado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
    } finally {
      this.guardando = false;
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
