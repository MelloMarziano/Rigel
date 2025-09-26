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

import {
  Categoria,
  Stats,
  FamiliaCategoria,
} from '../../../../core/models/categoria.model';
import { Producto } from '../../../../core/models/producto.model';

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
  productos: Producto[] = [];
  private categoriasSubscription?: Subscription;
  private productosSubscription?: Subscription;

  // Form
  categoriaForm: FormGroup;
  mostrarPaleta = false;
  nuevaUnidad = '';
  unidadesSeleccionadas: string[] = [];
  familias: FamiliaCategoria[] = [];
  nuevaFamilia = '';
  editandoFamiliaIndex = -1;

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
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    if (this.categoriasSubscription) {
      this.categoriasSubscription.unsubscribe();
    }
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
    }
  }

  private cargarCategorias(): void {
    const categoriasRef = collection(this.firestore, 'categorias');
    this.categoriasSubscription = collectionData(categoriasRef, {
      idField: 'id',
    }).subscribe((data: any) => {
      this.categorias = data;
      this.actualizarContadoresProductos();
      this.actualizarStats();
    });
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.productosSubscription = collectionData(productosRef, {
      idField: 'id',
    }).subscribe((data: any) => {
      this.productos = data;
      this.actualizarContadoresProductos();
      this.actualizarStats();
    });
  }

  private actualizarContadoresProductos(): void {
    // Actualizar contadores de productos por categoría y familia
    this.categorias.forEach((categoria) => {
      if (categoria.id) {
        // Contar productos por categoría
        const productosCategoria = this.productos.filter(
          (p) => p.categoriaId === categoria.id
        );
        categoria.productos = productosCategoria.length;

        // Actualizar contadores de familias
        if (categoria.familias) {
          categoria.familias.forEach((familia) => {
            const productosFamilia = productosCategoria.filter(
              (p) => p.familiaId === familia.id
            );
            familia.productos = productosFamilia.length;
          });
        }
      }
    });
  }

  private actualizarStats(): void {
    this.stats.totalCategorias = this.categorias.length;
    this.stats.totalProductos = this.productos.length;
    this.stats.unidadesMedida = [
      ...new Set(this.categorias.flatMap((cat) => cat.unidadesDisponibles)),
    ].length;
    this.stats.productosCombo = this.productos.filter(
      (p) => p.esCombinado
    ).length;
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

    // Cargar las familias (manejar categorías existentes sin familias)
    this.familias = [];
    if (categoria.familias && categoria.familias.length > 0) {
      this.familias = [...categoria.familias];
    } else {
      // Si no tiene familias, inicializar array vacío para permitir agregar nuevas
      this.familias = [];
    }

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

    // Validar familias solo para nuevas categorías
    const categoriaId = this.categoriaForm.get('id')?.value;
    if (!categoriaId && this.familias.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe agregar al menos una familia de productos para nuevas categorías',
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
        familias: [...this.familias],
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

  // Métodos para manejar familias
  agregarFamilia() {
    if (this.nuevaFamilia.trim()) {
      const nuevaFamilia: FamiliaCategoria = {
        id: this.generarIdFamilia(),
        nombre: this.nuevaFamilia.trim(),
        descripcion: '',
        productos: 0,
      };
      this.familias.push(nuevaFamilia);
      this.nuevaFamilia = '';
    }
  }

  private generarIdFamilia(): string {
    return 'fam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  editarFamilia(index: number) {
    this.editandoFamiliaIndex = index;
    this.nuevaFamilia = this.familias[index].nombre;
  }

  guardarEdicionFamilia() {
    if (this.editandoFamiliaIndex >= 0 && this.nuevaFamilia.trim()) {
      this.familias[this.editandoFamiliaIndex].nombre =
        this.nuevaFamilia.trim();
      this.editandoFamiliaIndex = -1;
      this.nuevaFamilia = '';
    }
  }

  cancelarEdicionFamilia() {
    this.editandoFamiliaIndex = -1;
    this.nuevaFamilia = '';
  }

  eliminarFamilia(index: number) {
    this.familias.splice(index, 1);
  }

  agregarFamiliasPredefinidas(tipo: 'barra' | 'cocina') {
    const familiasBarra = [
      {
        id: this.generarIdFamilia(),
        nombre: 'Whisky',
        descripcion: 'Whisky y derivados',
        productos: 0,
      },
      {
        id: this.generarIdFamilia(),
        nombre: 'Vinos',
        descripcion: 'Vinos tintos, blancos y rosados',
        productos: 0,
      },
      {
        id: this.generarIdFamilia(),
        nombre: 'Refrescos',
        descripcion: 'Bebidas sin alcohol',
        productos: 0,
      },
      {
        id: this.generarIdFamilia(),
        nombre: 'Cervezas',
        descripcion: 'Cervezas nacionales e importadas',
        productos: 0,
      },
    ];

    const familiasCocina = [
      {
        id: this.generarIdFamilia(),
        nombre: 'Entrantes',
        descripcion: 'Aperitivos y entrantes',
        productos: 0,
      },
      {
        id: this.generarIdFamilia(),
        nombre: 'Platos Fuertes',
        descripcion: 'Platos principales',
        productos: 0,
      },
      {
        id: this.generarIdFamilia(),
        nombre: 'Postres',
        descripcion: 'Postres y dulces',
        productos: 0,
      },
    ];

    const familiasAAgregar = tipo === 'barra' ? familiasBarra : familiasCocina;

    familiasAAgregar.forEach((familia) => {
      if (!this.familias.some((f) => f.nombre === familia.nombre)) {
        this.familias.push(familia);
      }
    });
  }

  // Métodos para obtener productos
  getProductosPorCategoria(categoriaId: string): Producto[] {
    return this.productos.filter((p) => p.categoriaId === categoriaId);
  }

  getProductosPorFamilia(categoriaId: string, familiaId: string): Producto[] {
    return this.productos.filter(
      (p) => p.categoriaId === categoriaId && p.familiaId === familiaId
    );
  }

  getProductosSinFamilia(categoriaId: string): Producto[] {
    return this.productos.filter(
      (p) =>
        p.categoriaId === categoriaId && (!p.familiaId || p.familiaId === '')
    );
  }

  getNombreProducto(producto: Producto): string {
    return producto.nombre;
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
    this.familias = [];
    this.nuevaFamilia = '';
    this.editandoFamiliaIndex = -1;
  }
}
