import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { Observable, Subscription } from 'rxjs';
declare var $: any;

declare var bootstrap: any;

import { Categoria, Stats } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-categoria-page',
  templateUrl: './categoria.page.html',
  styleUrls: ['./categoria.page.scss'],
})
export class CategoriaPage implements OnInit, OnDestroy {
  stats: Stats = {
    totalCategorias: 0,
    totalProductos: 0,
    unidadesMedida: 0,
    productosCombo: 0,
  };

  categorias: Categoria[] = [];
  private categoriasSubscription?: Subscription;

  // Form
  categoriaForm: FormGroup;
  mostrarPaleta = false;
  nuevaUnidad = '';
  unidadesSeleccionadas: string[] = [];

  // Paleta de colores
  coloresPaleta = [
    '#DC3545',
    '#B02A37',
    '#6EA8FE',
    '#031633',
    '#F8F9FA', // Fila 1
    '#FF4136',
    '#FF851B',
    '#FFDC00',
    '#00D1B2',
    '#0DCAF0', // Fila 2
    '#0A58CA',
    '#6610F2',
    '#0D6EFD',
    '#20C997',
    '#FFC107', // Fila 3
  ];

  // Unidades predefinidas
  unidadesBebidas = ['ml', 'L', 'oz', 'unidades'];
  unidadesComida = ['kg', 'g', 'lb', 'porciones', 'unidades'];

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      icono: ['bi-cup-straw'],
      colorFondo: ['#DC3545'],
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    if (this.categoriasSubscription) {
      this.categoriasSubscription.unsubscribe();
    }
  }

  private cargarCategorias(): void {
    const categoriasRef = collection(this.firestore, 'categorias');
    this.categoriasSubscription = collectionData(categoriasRef, {
      idField: 'id',
    }).subscribe((data: any) => {
      this.categorias = data;
      this.actualizarStats();
    });
  }

  private actualizarStats(): void {
    this.stats.totalCategorias = this.categorias.length;
    this.stats.totalProductos = this.categorias.reduce(
      (total, cat) => total + cat.productos,
      0
    );
    this.stats.unidadesMedida = [
      ...new Set(this.categorias.flatMap((cat) => cat.unidadesDisponibles)),
    ].length;
    // Nota: productosCombo requeriría una lógica específica basada en tus necesidades
    this.stats.productosCombo = 0; // Actualizar según tu lógica de negocio
  }

  // Métodos para la paleta de colores
  seleccionarColor(color: string) {
    this.categoriaForm.patchValue({ colorFondo: color });
    this.mostrarPaleta = false;
  }

  // Métodos para las unidades de medida
  agregarUnidadPersonalizada() {
    if (
      this.nuevaUnidad &&
      !this.unidadesSeleccionadas.includes(this.nuevaUnidad)
    ) {
      this.unidadesSeleccionadas.push(this.nuevaUnidad);
      this.nuevaUnidad = '';
    }
  }

  seleccionarUnidadesBebidas() {
    this.unidadesBebidas.forEach((unidad) => {
      if (!this.unidadesSeleccionadas.includes(unidad)) {
        this.unidadesSeleccionadas.push(unidad);
      }
    });
  }

  seleccionarUnidadesComida() {
    this.unidadesComida.forEach((unidad) => {
      if (!this.unidadesSeleccionadas.includes(unidad)) {
        this.unidadesSeleccionadas.push(unidad);
      }
    });
  }

  eliminarUnidad(unidad: string) {
    const index = this.unidadesSeleccionadas.indexOf(unidad);
    if (index > -1) {
      this.unidadesSeleccionadas.splice(index, 1);
    }
  }

  async eliminarCategoria(categoriaId: string | undefined) {
    if (!categoriaId) return;

    // Mostrar diálogo de confirmación
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    // Si el usuario confirma, proceder con la eliminación
    if (result.isConfirmed) {
      try {
        const categoriaRef = doc(this.firestore, 'categorias', categoriaId);
        await deleteDoc(categoriaRef);

        // Mostrar mensaje de éxito
        await Swal.fire(
          '¡Eliminado!',
          'La categoría ha sido eliminada.',
          'success'
        );
      } catch (error) {
        console.error('Error al eliminar la categoría:', error);
        // Mostrar mensaje de error
        await Swal.fire('Error', 'No se pudo eliminar la categoría.', 'error');
      }
    }
  }

  editarCategoria(categoria: Categoria): void {
    if (!categoria.id) return;

    // Agregar el control de ID antes de cargar los datos
    if (!this.categoriaForm.contains('id')) {
      this.categoriaForm.addControl('id', this.fb.control(''));
    }

    // Cargar los datos en el formulario
    this.categoriaForm.patchValue({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      icono: categoria.icono,
      colorFondo: categoria.colorFondo,
    });

    // Cargar las unidades seleccionadas
    this.unidadesSeleccionadas = [...(categoria.unidadesDisponibles || [])];

    // Abrir el modal
    const modalEl = document.getElementById('modalCategoria');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      // Modificar el texto del botón
      const guardarBtn = modalEl.querySelector('.btn-danger');
      if (guardarBtn) {
        guardarBtn.textContent = 'Actualizar Categoría';
      }
    }
  }

  // Método para guardar o actualizar la categoría
  async guardarCategoria() {
    if (!this.categoriaForm.valid) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos',
      });
      return;
    }

    if (this.unidadesSeleccionadas.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar al menos una unidad de medida',
      });
      return;
    }

    try {
      const categoriaData = {
        nombre: this.categoriaForm.get('nombre')?.value,
        descripcion: this.categoriaForm.get('descripcion')?.value,
        icono: this.categoriaForm.get('icono')?.value,
        colorFondo: this.categoriaForm.get('colorFondo')?.value,
        unidadesDisponibles: [...this.unidadesSeleccionadas],
      };

      const categoriaId = this.categoriaForm.get('id')?.value;

      // Mostrar loading
      Swal.showLoading();

      if (categoriaId) {
        // Actualizar categoría existente
        const categoriaRef = doc(this.firestore, 'categorias', categoriaId);
        await updateDoc(categoriaRef, categoriaData);

        await Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La categoría ha sido actualizada exitosamente',
          timer: 1500,
          showConfirmButton: false,
        });
        $('#modalCategoria').modal('hide');
      } else {
        // Crear nueva categoría
        const categoriasRef = collection(this.firestore, 'categorias');
        const nuevaCategoria = {
          ...categoriaData,
          productos: 0,
        };
        await addDoc(categoriasRef, nuevaCategoria);

        await Swal.fire({
          icon: 'success',
          title: '¡Creado!',
          text: 'La categoría ha sido creada exitosamente',
          timer: 1500,
          showConfirmButton: false,
        });
        $('#modalCategoria').modal('hide');
      }

      // Reset form y estado
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar la categoría. Inténtelo de nuevo.',
      });
    }
  }

  // Método para resetear el formulario y estado
  resetForm() {
    this.categoriaForm.reset({
      nombre: '',
      descripcion: '',
      icono: 'bi-cup-straw',
      colorFondo: '#DC3545',
    });
    this.unidadesSeleccionadas = [];
    this.nuevaUnidad = '';
  }
}
