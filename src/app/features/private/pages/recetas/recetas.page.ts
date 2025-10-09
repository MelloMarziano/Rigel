import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Producto } from '../../../../core/models/producto.model';

declare var bootstrap: any;

interface Ingrediente {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  unidadMedida: string;
  costo?: number;
}

interface Receta {
  id?: string;
  nombre: string;
  categoriaId: string;
  notasPreparacion?: string;
  ingredientes: Ingrediente[];
  costoTotal?: number;
  activo: boolean;
  fechaCreacion?: any;
  fechaActualizacion?: any;
}

@Component({
  selector: 'app-recetas-page',
  templateUrl: './recetas.page.html',
  styleUrls: ['./recetas.page.scss'],
})
export class RecetasPage implements OnInit, OnDestroy {
  recetas: Receta[] = [];
  productos: Producto[] = [];
  recetaForm!: FormGroup;
  modal: any;
  detalleModal: any;
  recetaSeleccionada: Receta | null = null;

  // Estadísticas
  totalRecetas = 0;
  recetasActivas = 0;
  totalIngredientes = 0;
  costoPromedio = 0;

  // Categorías de recetas
  categorias = [
    { id: 'platos', nombre: 'Platos' },
    { id: 'bebidas', nombre: 'Bebidas' },
    { id: 'postres', nombre: 'Postres' },
    { id: 'entradas', nombre: 'Entradas' },
    { id: 'salsas', nombre: 'Salsas' },
    { id: 'guarniciones', nombre: 'Guarniciones' },
  ];

  // Conversiones de unidades
  private conversionesUnidades: { [key: string]: { [key: string]: number } } = {
    'kg (kilogramos)': {
      'g (gramos)': 1000,
      'kg (kilogramos)': 1,
    },
    'g (gramos)': {
      'g (gramos)': 1,
      'kg (kilogramos)': 0.001,
    },
    'L (litros)': {
      'ml (mililitros)': 1000,
      'L (litros)': 1,
    },
    'ml (mililitros)': {
      'ml (mililitros)': 1,
      'L (litros)': 0.001,
    },
    unidades: {
      unidades: 1,
    },
  };

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.inicializarForm();
  }

  ngOnInit(): void {
    // Cargar productos primero, luego recetas
    this.cargarProductos();
    this.cargarRecetas();

    const modalEl = document.getElementById('recetaModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }

    const detalleModalEl = document.getElementById('detalleRecetaModal');
    if (detalleModalEl) {
      this.detalleModal = new bootstrap.Modal(detalleModalEl);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private inicializarForm(): void {
    this.recetaForm = this.fb.group({
      id: [''],
      nombre: [''],
      categoriaId: [''],
      notasPreparacion: [''],
      ingredientes: this.fb.array([]),
      activo: [true],
    });
  }

  get ingredientes(): FormArray {
    return this.recetaForm.get('ingredientes') as FormArray;
  }

  agregarIngrediente(): void {
    const ingredienteGroup = this.fb.group({
      productoId: [''],
      cantidad: [0],
      unidadMedida: ['g (gramos)'],
    });
    this.ingredientes.push(ingredienteGroup);
  }

  eliminarIngrediente(index: number): void {
    this.ingredientes.removeAt(index);
  }

  private cargarRecetas(): void {
    const recetasRef = collection(this.firestore, 'recetas');
    this.subscriptions.add(
      collectionData(recetasRef, { idField: 'id' }).subscribe((data: any[]) => {
        this.recetas = data.map((receta) => this.calcularCostos(receta));
        this.calcularEstadisticas();
      })
    );
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe(
        (data: any[]) => {
          this.productos = data.filter((p) => !p.esCombinado);

          // Recalcular costos de recetas existentes cuando los productos estén cargados
          if (this.recetas.length > 0) {
            this.recetas = this.recetas.map((receta) =>
              this.calcularCostos(receta)
            );
            this.calcularEstadisticas();
          }
        }
      )
    );
  }

  private calcularCostos(receta: Receta): Receta {
    let costoTotal = 0;

    // Si no hay productos cargados aún, retornar la receta sin calcular
    if (!this.productos || this.productos.length === 0) {
      receta.costoTotal = 0;
      return receta;
    }

    receta.ingredientes.forEach((ing) => {
      const producto = this.productos.find((p) => p.id === ing.productoId);
      if (producto) {
        ing.productoNombre = producto.nombre;

        // Mantener la unidad seleccionada en la receta, no la del producto
        if (!ing.unidadMedida) {
          ing.unidadMedida = producto.unidadMedida;
        }

        // Verificar que los valores sean válidos antes de calcular
        if (ing.cantidad > 0 && producto.cantidad > 0 && producto.costo > 0) {
          // Convertir la cantidad a la unidad original del producto para calcular el costo
          const factorConversion = this.obtenerFactorConversion(
            ing.unidadMedida,
            producto.unidadMedida
          );

          if (factorConversion > 0) {
            const cantidadEnUnidadOriginal = ing.cantidad * factorConversion;
            const costoPorUnidadOriginal = producto.costo / producto.cantidad;
            const costoIngrediente =
              costoPorUnidadOriginal * cantidadEnUnidadOriginal;

            // Verificar que el resultado sea finito
            if (isFinite(costoIngrediente) && costoIngrediente >= 0) {
              ing.costo = costoIngrediente;
              costoTotal += costoIngrediente;
            } else {
              ing.costo = 0;
            }
          } else {
            ing.costo = 0;
          }
        } else {
          ing.costo = 0;
        }
      } else {
        // Producto no encontrado
        ing.costo = 0;
      }
    });

    receta.costoTotal = isFinite(costoTotal) ? costoTotal : 0;
    return receta;
  }

  private calcularEstadisticas(): void {
    this.totalRecetas = this.recetas.length;
    this.recetasActivas = this.recetas.filter((r) => r.activo).length;
    this.totalIngredientes = this.recetas.reduce(
      (sum, r) => sum + r.ingredientes.length,
      0
    );

    if (this.recetas.length > 0) {
      const sumaCostos = this.recetas.reduce(
        (sum, r) => sum + (r.costoTotal || 0),
        0
      );
      this.costoPromedio = sumaCostos / this.recetas.length;
    } else {
      this.costoPromedio = 0;
    }
  }

  abrirModalNuevo(): void {
    this.recetaForm.reset({
      id: '',
      nombre: '',
      categoriaId: '',
      notasPreparacion: '',
      activo: true,
    });
    this.ingredientes.clear();
    this.agregarIngrediente();
    this.modal.show();
  }

  verDetalleReceta(receta: Receta): void {
    this.recetaSeleccionada = this.calcularCostos({ ...receta });
    this.detalleModal.show();
  }

  editarReceta(receta: Receta): void {
    this.recetaForm.patchValue(receta);
    this.ingredientes.clear();

    receta.ingredientes.forEach((ing) => {
      const ingredienteGroup = this.fb.group({
        productoId: [ing.productoId],
        cantidad: [ing.cantidad],
        unidadMedida: [ing.unidadMedida],
      });
      this.ingredientes.push(ingredienteGroup);
    });
    this.modal.show();
  }

  editarDesdeDetalle(): void {
    if (this.recetaSeleccionada) {
      this.detalleModal.hide();
      this.editarReceta(this.recetaSeleccionada);
    }
  }

  async eliminarReceta(recetaId: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar Receta?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(this.firestore, 'recetas', recetaId));
        Swal.fire('¡Eliminada!', 'La receta ha sido eliminada.', 'success');
      } catch (error) {
        console.error('Error al eliminar receta:', error);
        Swal.fire('Error', 'No se pudo eliminar la receta.', 'error');
      }
    }
  }

  async eliminarDesdeDetalle(): Promise<void> {
    if (this.recetaSeleccionada?.id) {
      this.detalleModal.hide();
      await this.eliminarReceta(this.recetaSeleccionada.id);
      this.recetaSeleccionada = null;
    }
  }

  async guardarReceta(): Promise<void> {
    const formValue = this.recetaForm.value;
    const recetaData = {
      nombre: formValue.nombre || '',
      categoriaId: formValue.categoriaId || '',
      notasPreparacion: formValue.notasPreparacion || '',
      ingredientes: formValue.ingredientes || [],
      activo: formValue.activo,
      fechaActualizacion: new Date(),
    };

    try {
      if (formValue.id) {
        const recetaRef = doc(this.firestore, 'recetas', formValue.id);
        await updateDoc(recetaRef, recetaData);
        Swal.fire('¡Actualizada!', 'La receta ha sido actualizada.', 'success');
      } else {
        const newRecetaData = {
          ...recetaData,
          fechaCreacion: serverTimestamp(),
        };
        await addDoc(collection(this.firestore, 'recetas'), newRecetaData);
        Swal.fire('¡Creada!', 'La nueva receta ha sido guardada.', 'success');
      }
      this.modal.hide();
      this.recetaForm.reset();
    } catch (error) {
      console.error('Error al guardar receta:', error);
      Swal.fire('Error', 'Hubo un problema al guardar la receta.', 'error');
    }
  }

  getCategoriaNombre(categoriaId: string): string {
    const categoria = this.categorias.find((c) => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  }

  getCategoriaBadgeClass(categoriaId: string): string {
    const clases: { [key: string]: string } = {
      platos: 'bg-primary',
      bebidas: 'bg-info',
      postres: 'bg-warning text-dark',
      entradas: 'bg-success',
      salsas: 'bg-danger',
      guarniciones: 'bg-secondary',
    };
    return clases[categoriaId] || 'bg-secondary';
  }

  getProductoNombre(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  }

  calcularPorcentajeCosto(ingrediente: Ingrediente, receta: Receta): number {
    if (!receta.costoTotal || receta.costoTotal === 0) return 0;
    return ((ingrediente.costo || 0) / receta.costoTotal) * 100;
  }

  getProductoNombreById(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.nombre || '';
  }

  onProductoInput(index: number, event: any): void {
    const nombreProducto = event.target.value.trim();

    // Buscar producto por nombre exacto
    const producto = this.productos.find(
      (p) => p.nombre.toLowerCase() === nombreProducto.toLowerCase()
    );

    const ingredienteControl = this.ingredientes.at(index);

    if (producto) {
      // Producto encontrado - establecer ID y unidad por defecto
      ingredienteControl.patchValue({
        productoId: producto.id,
        unidadMedida: producto.unidadMedida,
      });
    } else {
      // No se encontró producto exacto - limpiar solo el ID
      ingredienteControl.patchValue({
        productoId: '',
      });
    }
  }

  onProductoBlur(index: number, event: any): void {
    const nombreProducto = event.target.value.trim();
    const producto = this.productos.find(
      (p) => p.nombre.toLowerCase() === nombreProducto.toLowerCase()
    );

    if (producto) {
      // Establecer el nombre completo del producto
      event.target.value = producto.nombre;
    } else if (nombreProducto === '') {
      // Si está vacío, limpiar todo
      const ingredienteControl = this.ingredientes.at(index);
      ingredienteControl.patchValue({
        productoId: '',
        unidadMedida: '',
      });
    }
  }

  getProductoById(productoId: string): Producto | null {
    return this.productos.find((p) => p.id === productoId) || null;
  }

  isFinite(value: any): boolean {
    return Number.isFinite(value);
  }

  getUnidadesCompatibles(productoId: string): string[] {
    const producto = this.productos.find((p) => p.id === productoId);
    if (!producto) return [];

    const unidadOriginal = producto.unidadMedida;
    const conversiones = this.conversionesUnidades[unidadOriginal];

    return conversiones ? Object.keys(conversiones) : [unidadOriginal];
  }

  actualizarCostoIngrediente(index: number): void {
    // Este método se llama cuando cambia la cantidad o unidad
    // El cálculo se hace automáticamente en calcularCostoIngredientePreview
  }

  calcularCostoIngredientePreview(index: number): number {
    const ingredienteControl = this.ingredientes.at(index);
    const productoId = ingredienteControl.get('productoId')?.value;
    const cantidad = ingredienteControl.get('cantidad')?.value || 0;
    const unidadSeleccionada = ingredienteControl.get('unidadMedida')?.value;

    if (!productoId || cantidad <= 0 || !unidadSeleccionada) return 0;

    const producto = this.productos.find((p) => p.id === productoId);
    if (!producto || producto.cantidad <= 0 || producto.costo <= 0) return 0;

    // Convertir la cantidad a la unidad original del producto
    const factorConversion = this.obtenerFactorConversion(
      unidadSeleccionada,
      producto.unidadMedida
    );
    if (factorConversion === 0) return 0;

    const cantidadEnUnidadOriginal = cantidad * factorConversion;

    // Calcular costo
    const costoPorUnidadOriginal = producto.costo / producto.cantidad;
    const costoTotal = costoPorUnidadOriginal * cantidadEnUnidadOriginal;

    return isFinite(costoTotal) ? costoTotal : 0;
  }

  private obtenerFactorConversion(
    unidadOrigen: string,
    unidadDestino: string
  ): number {
    if (unidadOrigen === unidadDestino) return 1;

    // Buscar en las conversiones
    const conversionesOrigen = this.conversionesUnidades[unidadOrigen];
    if (conversionesOrigen && conversionesOrigen[unidadDestino]) {
      return 1 / conversionesOrigen[unidadDestino];
    }

    const conversionesDestino = this.conversionesUnidades[unidadDestino];
    if (conversionesDestino && conversionesDestino[unidadOrigen]) {
      return conversionesDestino[unidadOrigen];
    }

    return 0; // No hay conversión disponible
  }

  get costoPreview(): { costoTotal: number } {
    let costoTotal = 0;

    this.ingredientes.controls.forEach((control, index) => {
      const costoIngrediente = this.calcularCostoIngredientePreview(index);
      costoTotal += costoIngrediente;
    });

    return {
      costoTotal: isFinite(costoTotal) ? costoTotal : 0,
    };
  }
}
