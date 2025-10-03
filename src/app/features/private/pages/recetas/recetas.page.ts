import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import {
  Receta,
  IngredienteReceta,
  EstadisticasRecetas,
} from '../../../../core/models/receta.model';
import { Producto } from '../../../../core/models/producto.model';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-recetas-page',
  templateUrl: './recetas.page.html',
  styleUrls: ['./recetas.page.scss'],
})
export class RecetasPage implements OnInit, OnDestroy {
  recetas: Receta[] = [];
  recetasFiltradas: Receta[] = [];
  productos: Producto[] = [];
  estadisticas: EstadisticasRecetas = {
    totalRecetas: 0,
    cocteles: 0,
    platos: 0,
    ingredientesTotales: 0,
  };

  filtros = {
    busqueda: '',
    tipo: '',
    disponibilidad: '',
  };

  recetaForm!: FormGroup;
  modoEdicion = false;
  recetaEditando: Receta | null = null;
  costoReceta = 0;
  margenReceta = 0;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.inicializarForm();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private inicializarForm(): void {
    this.recetaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      tipo: ['Cocteles', [Validators.required]],
      descripcion: [''], // Descripción opcional
      precioVenta: [null, [Validators.required, Validators.min(0)]],
      ingredientes: this.fb.array([]),
    });
  }

  get ingredientesFormArray(): FormArray {
    return this.recetaForm.get('ingredientes') as FormArray;
  }

  private cargarDatos(): void {
    const recetasRef = collection(this.firestore, 'recetas');
    const productosRef = collection(this.firestore, 'productos');

    this.subscriptions.add(
      combineLatest([
        collectionData(recetasRef, { idField: 'id' }),
        collectionData(productosRef, { idField: 'id' }),
      ]).subscribe(([recetas, productos]: [any[], any[]]) => {
        this.recetas = recetas.map((r) => ({
          ...r,
          costoTotal: this.calcularCostoReceta(r.ingredientes || []),
          margen: this.calcularMargen(
            r.precioVenta,
            this.calcularCostoReceta(r.ingredientes || [])
          ),
          disponible: this.verificarDisponibilidad(r.ingredientes || []),
        }));

        this.productos = productos.filter((p) => !p.esCombinado);
        this.calcularEstadisticas();
        this.actualizarNombresIngredientes();
        this.aplicarFiltros();
      })
    );
  }

  private calcularEstadisticas(): void {
    this.estadisticas = {
      totalRecetas: this.recetas.length,
      cocteles: this.recetas.filter((r) => r.tipo === 'Cocteles').length,
      platos: this.recetas.filter((r) => r.tipo === 'Platos').length,
      ingredientesTotales: this.recetas.reduce(
        (acc, r) => acc + (r.ingredientes?.length || 0),
        0
      ),
    };
  }

  private actualizarNombresIngredientes(): void {
    this.recetas.forEach((receta) => {
      if (receta.ingredientes) {
        receta.ingredientes.forEach((ingrediente) => {
          const producto = this.productos.find(
            (p) => p.id === ingrediente.productoId
          );
          if (producto) {
            ingrediente.nombre = producto.nombre;
          }
        });
      }
    });
  }

  private calcularCostoReceta(ingredientes: IngredienteReceta[]): number {
    return ingredientes.reduce((total, ingrediente) => {
      const producto = this.productos.find(
        (p) => p.id === ingrediente.productoId
      );
      if (producto) {
        const costoPorUnidad = this.calcularCostoPorUnidad(
          producto,
          ingrediente.unidad
        );
        return total + costoPorUnidad * ingrediente.cantidad;
      }
      return total;
    }, 0);
  }

  private calcularCostoPorUnidad(producto: Producto, unidad: string): number {
    // Convertir el costo del producto a la unidad solicitada
    const costoBase = producto.costo;
    const unidadBase = producto.unidadMedida;

    // Conversiones básicas (esto se puede expandir según necesidades)
    if (unidadBase === unidad) {
      return costoBase;
    }

    // Conversiones comunes
    const conversiones: { [key: string]: { [key: string]: number } } = {
      kg: { gr: 1000, ml: 1000 },
      l: { ml: 1000 },
      unidad: { ml: 1, gr: 1 },
    };

    if (conversiones[unidadBase] && conversiones[unidadBase][unidad]) {
      return costoBase / conversiones[unidadBase][unidad];
    }

    return costoBase; // Fallback
  }

  private calcularMargen(precioVenta: number, costo: number): number {
    if (precioVenta === 0) return 0;
    return ((precioVenta - costo) / precioVenta) * 100;
  }

  private verificarDisponibilidad(ingredientes: IngredienteReceta[]): boolean {
    if (!ingredientes || ingredientes.length === 0) {
      return true; // Si no tiene ingredientes, está disponible
    }

    return ingredientes.every((ingrediente) => {
      const producto = this.productos.find(
        (p) => p.id === ingrediente.productoId
      );
      // Si no encuentra el producto o no tiene stock suficiente, no está disponible
      if (!producto) return false;

      const stockDisponible = producto.stock || 0;
      return stockDisponible >= (ingrediente.cantidad || 0);
    });
  }

  abrirModalReceta(): void {
    this.modoEdicion = false;
    this.recetaEditando = null;
    this.recetaForm.reset();
    this.ingredientesFormArray.clear();
    this.costoReceta = 0;
    this.margenReceta = 0;
    $('#modalReceta').modal('show');
  }

  editarReceta(receta: Receta): void {
    this.modoEdicion = true;
    this.recetaEditando = receta;

    this.recetaForm.patchValue({
      nombre: receta.nombre,
      tipo: receta.tipo,
      descripcion: receta.descripcion,
      precioVenta: receta.precioVenta,
    });

    // Limpiar ingredientes existentes
    this.ingredientesFormArray.clear();

    // Agregar ingredientes de la receta
    if (receta.ingredientes) {
      receta.ingredientes.forEach((ingrediente) => {
        this.ingredientesFormArray.push(
          this.fb.group({
            productoId: [ingrediente.productoId, Validators.required],
            cantidad: [
              ingrediente.cantidad,
              [Validators.required, Validators.min(0)],
            ],
            unidad: [ingrediente.unidad, Validators.required],
          })
        );
      });
    }

    this.calcularCostos();
    $('#modalReceta').modal('show');
  }

  verReceta(receta: Receta): void {
    const ingredientesHtml =
      receta.ingredientes
        ?.map((ing) => `<li>${ing.nombre}: ${ing.cantidad} ${ing.unidad}</li>`)
        .join('') || '';

    Swal.fire({
      title: receta.nombre,
      html: `
        <div class="text-start">
          <p><strong>Tipo:</strong> ${receta.tipo}</p>
          <p><strong>Descripción:</strong> ${receta.descripcion}</p>
          <p><strong>Precio de Venta:</strong> €${receta.precioVenta}</p>
          <p><strong>Costo:</strong> €${receta.costoTotal?.toFixed(2)}</p>
          <p><strong>Margen:</strong> ${receta.margen?.toFixed(1)}%</p>
          <p><strong>Ingredientes:</strong></p>
          <ul>${ingredientesHtml}</ul>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar',
    });
  }

  agregarIngrediente(): void {
    const ingredienteGroup = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0)]],
      unidad: ['ml', Validators.required],
    });

    this.ingredientesFormArray.push(ingredienteGroup);
  }

  eliminarIngrediente(index: number): void {
    this.ingredientesFormArray.removeAt(index);
    this.calcularCostos();
  }

  onProductoChange(index: number): void {
    this.calcularCostos();
  }

  calcularCostos(): void {
    const ingredientes = this.ingredientesFormArray.value;
    this.costoReceta = this.calcularCostoReceta(ingredientes);

    const precioVenta = this.recetaForm.get('precioVenta')?.value || 0;
    this.margenReceta = this.calcularMargen(precioVenta, this.costoReceta);
  }

  async guardarReceta(): Promise<void> {
    if (!this.recetaForm.valid) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos',
        'error'
      );
      return;
    }

    const formValue = this.recetaForm.value;
    const recetaData: Receta = {
      ...formValue,
      costoTotal: this.costoReceta,
      margen: this.margenReceta,
      disponible: this.verificarDisponibilidad(formValue.ingredientes),
      fechaActualizacion: new Date(),
    };

    try {
      if (this.modoEdicion && this.recetaEditando?.id) {
        const recetaRef = doc(
          this.firestore,
          'recetas',
          this.recetaEditando.id
        );
        await updateDoc(recetaRef, this.cleanObjectForFirebase(recetaData));
        Swal.fire('¡Éxito!', 'Receta actualizada correctamente', 'success');
      } else {
        recetaData.fechaCreacion = new Date();
        const recetasRef = collection(this.firestore, 'recetas');
        await addDoc(recetasRef, this.cleanObjectForFirebase(recetaData));
        Swal.fire('¡Éxito!', 'Receta creada correctamente', 'success');
      }

      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar receta:', error);
      Swal.fire('Error', 'No se pudo guardar la receta', 'error');
    }
  }

  cerrarModal(): void {
    $('#modalReceta').modal('hide');
    this.recetaForm.reset();
    this.ingredientesFormArray.clear();
    this.modoEdicion = false;
    this.recetaEditando = null;
  }

  aplicarFiltros(): void {
    let recetasFiltradas = [...this.recetas];

    // Filtro por búsqueda (nombre o descripción)
    if (this.filtros.busqueda.trim()) {
      const busqueda = this.filtros.busqueda.toLowerCase().trim();
      recetasFiltradas = recetasFiltradas.filter(
        (receta) =>
          receta.nombre.toLowerCase().includes(busqueda) ||
          receta.descripcion.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por tipo
    if (this.filtros.tipo) {
      recetasFiltradas = recetasFiltradas.filter(
        (receta) => receta.tipo === this.filtros.tipo
      );
    }

    // Filtro por disponibilidad
    if (this.filtros.disponibilidad) {
      if (this.filtros.disponibilidad === 'disponible') {
        recetasFiltradas = recetasFiltradas.filter(
          (receta) => receta.disponible
        );
      } else if (this.filtros.disponibilidad === 'no-disponible') {
        recetasFiltradas = recetasFiltradas.filter(
          (receta) => !receta.disponible
        );
      }
    }

    this.recetasFiltradas = recetasFiltradas;
  }

  async eliminarReceta(receta: Receta): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar receta?',
      html: `
        <div class="text-start">
          <p>¿Estás seguro de que quieres eliminar la receta <strong>"${receta.nombre}"</strong>?</p>
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Esta acción no se puede deshacer.
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed && receta.id) {
      try {
        const recetaRef = doc(this.firestore, 'recetas', receta.id);
        await deleteDoc(recetaRef);

        Swal.fire({
          title: '¡Eliminada!',
          text: 'La receta ha sido eliminada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error al eliminar receta:', error);
        Swal.fire('Error', 'No se pudo eliminar la receta', 'error');
      }
    }
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda: '',
      tipo: '',
      disponibilidad: '',
    };
    this.aplicarFiltros();
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

  getProductoNombre(productoId: string): string {
    if (!productoId) return '';
    const producto = this.productos.find((p) => p.id === productoId);
    return producto ? producto.nombre : '';
  }

  onProductoInput(event: any, index: number): void {
    // Este método se ejecuta mientras el usuario escribe
    // El datalist se encarga de filtrar automáticamente
  }

  onProductoSeleccionado(event: any, index: number): void {
    const nombreProducto = event.target.value;
    const producto = this.productos.find((p) => p.nombre === nombreProducto);

    if (producto) {
      const ingredienteGroup = this.ingredientesFormArray.at(index);
      ingredienteGroup.patchValue({
        productoId: producto.id,
      });
      this.calcularCostos();
    }
  }
}
