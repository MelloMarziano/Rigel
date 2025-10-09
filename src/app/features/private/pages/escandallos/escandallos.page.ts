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
import { MermasService, Merma } from '../../../../core/services/mermas.service';

declare var bootstrap: any;

interface IngredienteBase {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  unidadMedida: string;
  costoSinMerma: number;
  mermaId?: string;
  porcentajeMerma: number;
  costoConMerma: number;
}

interface RecetaEscandallo {
  recetaId: string;
  recetaNombre?: string;
  cantidad: number;
  unidadMedida: string;
  costo: number;
}

interface Escandallo {
  id?: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precioVenta: number;
  porciones: number;
  ingredientesBase: IngredienteBase[];
  recetas: RecetaEscandallo[];
  costoTotal: number;
  costoTotalConMermas: number;
  costoPorPorcion: number;
  margen: number;
  margenPorcentaje: number;
  activo: boolean;
  fechaCreacion?: any;
  fechaActualizacion?: any;
}

interface Receta {
  id: string;
  nombre: string;
  rendimiento: number;
  unidadRendimiento: string;
  costoTotal: number;
  costoPorUnidad: number;
}

@Component({
  selector: 'app-escandallos-page',
  templateUrl: './escandallos.page.html',
  styleUrls: ['./escandallos.page.scss'],
})
export class EscandallosPage implements OnInit, OnDestroy {
  escandallos: Escandallo[] = [];
  productos: Producto[] = [];
  recetas: Receta[] = [];
  mermas: Merma[] = [];
  escandalloForm!: FormGroup;
  modal: any;
  detalleModal: any;
  escandalloSeleccionado: Escandallo | null = null;

  // Estadísticas
  totalEscandallos = 0;
  escandallosActivos = 0;
  margenPromedio = 0;
  totalPorciones = 0;

  // Categorías
  categorias = [
    { id: 'platos', nombre: 'Platos' },
    { id: 'bebidas', nombre: 'Bebidas' },
    { id: 'postres', nombre: 'Postres' },
    { id: 'entradas', nombre: 'Entradas' },
    { id: 'menu', nombre: 'Menú' },
  ];

  // Buscadores
  busquedaProductos: { [key: number]: string } = {};
  busquedaRecetas: { [key: number]: string } = {};
  productosFiltradosIngrediente: Producto[] = [];
  recetasFiltradas: Receta[] = [];
  mostrarListaProductosIndex: number | null = null;
  mostrarListaRecetasIndex: number | null = null;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private mermasService: MermasService
  ) {
    this.inicializarForm();
  }

  ngOnInit(): void {
    this.cargarEscandallos();
    this.cargarProductos();
    this.cargarRecetas();
    this.cargarMermas();

    const modalEl = document.getElementById('escandalloModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }

    const detalleModalEl = document.getElementById('detalleEscandalloModal');
    if (detalleModalEl) {
      this.detalleModal = new bootstrap.Modal(detalleModalEl);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private inicializarForm(): void {
    this.escandalloForm = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      descripcion: [''],
      categoriaId: ['', Validators.required],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      porciones: [1, [Validators.required, Validators.min(1)]],
      ingredientesBase: this.fb.array([]),
      recetas: this.fb.array([]),
      activo: [true],
    });
  }

  get ingredientesBase(): FormArray {
    return this.escandalloForm.get('ingredientesBase') as FormArray;
  }

  get recetasArray(): FormArray {
    return this.escandalloForm.get('recetas') as FormArray;
  }

  agregarIngredienteBase(): void {
    const ingredienteGroup = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      mermaId: [''],
    });
    this.ingredientesBase.push(ingredienteGroup);
  }

  eliminarIngredienteBase(index: number): void {
    this.ingredientesBase.removeAt(index);
  }

  agregarReceta(): void {
    const recetaGroup = this.fb.group({
      recetaId: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
    });
    this.recetasArray.push(recetaGroup);
  }

  eliminarReceta(index: number): void {
    this.recetasArray.removeAt(index);
  }

  private cargarEscandallos(): void {
    const escandallosRef = collection(this.firestore, 'escandallos');
    this.subscriptions.add(
      collectionData(escandallosRef, { idField: 'id' }).subscribe(
        (data: any[]) => {
          this.escandallos = data.map((esc) => this.calcularCostos(esc));
          this.calcularEstadisticas();
        }
      )
    );
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe(
        (data: any[]) => {
          this.productos = data.filter((p) => !p.esCombinado);
        }
      )
    );
  }

  private cargarRecetas(): void {
    const recetasRef = collection(this.firestore, 'recetas');
    this.subscriptions.add(
      collectionData(recetasRef, { idField: 'id' }).subscribe((data: any[]) => {
        this.recetas = data.map((r) => this.calcularCostosReceta(r));
      })
    );
  }

  private cargarMermas(): void {
    this.subscriptions.add(
      this.mermasService.getMermasCocinaActivas().subscribe((data) => {
        this.mermas = data;
        console.log('Mermas de cocina cargadas:', this.mermas); // Para debug
      })
    );
  }

  // Método para obtener mermas disponibles para un producto específico
  getMermasDisponibles(productoId: string): Merma[] {
    if (!productoId) return [];
    return this.mermas.filter((m) => m.productoId === productoId);
  }

  private calcularCostosReceta(receta: any): Receta {
    let costoTotal = 0;

    if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
      receta.ingredientes.forEach((ing: any) => {
        const producto = this.productos.find((p) => p.id === ing.productoId);
        if (producto && producto.cantidad > 0) {
          const costoPorUnidad = producto.costo / producto.cantidad;
          costoTotal += costoPorUnidad * ing.cantidad;
        }
      });
    }

    const costoPorUnidad =
      receta.rendimiento > 0 ? costoTotal / receta.rendimiento : 0;

    return {
      id: receta.id,
      nombre: receta.nombre,
      rendimiento: receta.rendimiento || 0,
      unidadRendimiento: receta.unidadRendimiento || 'g',
      costoTotal,
      costoPorUnidad,
    };
  }

  private calcularCostos(escandallo: Escandallo): Escandallo {
    let costoTotal = 0;
    let costoTotalConMermas = 0;

    // Calcular costos de ingredientes base
    if (escandallo.ingredientesBase) {
      escandallo.ingredientesBase.forEach((ing) => {
        const producto = this.productos.find((p) => p.id === ing.productoId);
        if (producto && producto.cantidad > 0) {
          ing.productoNombre = producto.nombre;
          ing.unidadMedida = producto.unidadMedida;

          // Costo sin merma
          const costoPorUnidad = producto.costo / producto.cantidad;
          ing.costoSinMerma = costoPorUnidad * ing.cantidad;
          costoTotal += ing.costoSinMerma;

          // Buscar merma del producto
          const merma = this.mermas.find((m) => m.productoId === producto.id);
          if (merma) {
            ing.mermaId = merma.id;
            ing.porcentajeMerma = merma.porcentajeMerma;
            // Ajustar costo por merma
            const cantidadConMerma =
              ing.cantidad / (1 - merma.porcentajeMerma / 100);
            ing.costoConMerma = costoPorUnidad * cantidadConMerma;
          } else {
            ing.porcentajeMerma = 0;
            ing.costoConMerma = ing.costoSinMerma;
          }
          costoTotalConMermas += ing.costoConMerma;
        }
      });
    }

    // Calcular costos de recetas
    if (escandallo.recetas) {
      escandallo.recetas.forEach((rec) => {
        const receta = this.recetas.find((r) => r.id === rec.recetaId);
        if (receta) {
          rec.recetaNombre = receta.nombre;
          rec.unidadMedida = receta.unidadRendimiento;
          rec.costo = receta.costoPorUnidad * rec.cantidad;
          costoTotal += rec.costo;
          costoTotalConMermas += rec.costo;
        }
      });
    }

    escandallo.costoTotal = costoTotal;
    escandallo.costoTotalConMermas = costoTotalConMermas;
    escandallo.costoPorPorcion =
      escandallo.porciones > 0 ? costoTotalConMermas / escandallo.porciones : 0;
    escandallo.margen = escandallo.precioVenta - escandallo.costoPorPorcion;
    escandallo.margenPorcentaje =
      escandallo.precioVenta > 0
        ? (escandallo.margen / escandallo.precioVenta) * 100
        : 0;

    return escandallo;
  }

  private calcularEstadisticas(): void {
    this.totalEscandallos = this.escandallos.length;
    this.escandallosActivos = this.escandallos.filter((e) => e.activo).length;
    this.totalPorciones = this.escandallos.reduce(
      (sum, e) => sum + e.porciones,
      0
    );

    if (this.escandallos.length > 0) {
      const sumaMargen = this.escandallos.reduce(
        (sum, e) => sum + e.margenPorcentaje,
        0
      );
      this.margenPromedio = sumaMargen / this.escandallos.length;
    } else {
      this.margenPromedio = 0;
    }
  }

  abrirModalNuevo(): void {
    this.escandalloForm.reset({
      id: '',
      nombre: '',
      descripcion: '',
      categoriaId: '',
      precioVenta: 0,
      porciones: 1,
      activo: true,
    });
    this.ingredientesBase.clear();
    this.recetasArray.clear();
    this.modal.show();
  }

  verDetalleEscandallo(escandallo: Escandallo): void {
    this.escandalloSeleccionado = this.calcularCostos({ ...escandallo });
    this.detalleModal.show();
  }

  editarEscandallo(escandallo: Escandallo): void {
    this.escandalloForm.patchValue(escandallo);
    this.ingredientesBase.clear();
    this.recetasArray.clear();

    if (escandallo.ingredientesBase) {
      escandallo.ingredientesBase.forEach((ing) => {
        const ingredienteGroup = this.fb.group({
          productoId: [ing.productoId, Validators.required],
          cantidad: [ing.cantidad, [Validators.required, Validators.min(0)]],
          mermaId: [ing.mermaId || ''],
        });
        this.ingredientesBase.push(ingredienteGroup);
      });
    }

    if (escandallo.recetas) {
      escandallo.recetas.forEach((rec) => {
        const recetaGroup = this.fb.group({
          recetaId: [rec.recetaId, Validators.required],
          cantidad: [rec.cantidad, [Validators.required, Validators.min(0)]],
        });
        this.recetasArray.push(recetaGroup);
      });
    }

    this.modal.show();
  }

  editarDesdeDetalle(): void {
    if (this.escandalloSeleccionado) {
      this.detalleModal.hide();
      this.editarEscandallo(this.escandalloSeleccionado);
    }
  }

  async eliminarEscandallo(escandalloId: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar Escandallo?',
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
        await deleteDoc(doc(this.firestore, 'escandallos', escandalloId));
        Swal.fire('¡Eliminado!', 'El escandallo ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error al eliminar escandallo:', error);
        Swal.fire('Error', 'No se pudo eliminar el escandallo.', 'error');
      }
    }
  }

  async eliminarDesdeDetalle(): Promise<void> {
    if (this.escandalloSeleccionado?.id) {
      this.detalleModal.hide();
      await this.eliminarEscandallo(this.escandalloSeleccionado.id);
      this.escandalloSeleccionado = null;
    }
  }

  async guardarEscandallo(): Promise<void> {
    if (this.escandalloForm.invalid) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos.',
        'error'
      );
      return;
    }

    const formValue = this.escandalloForm.value;
    const escandalloData = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || '',
      categoriaId: formValue.categoriaId,
      precioVenta: formValue.precioVenta,
      porciones: formValue.porciones,
      ingredientesBase: formValue.ingredientesBase || [],
      recetas: formValue.recetas || [],
      activo: formValue.activo,
      fechaActualizacion: new Date(),
    };

    try {
      if (formValue.id) {
        const escandalloRef = doc(this.firestore, 'escandallos', formValue.id);
        await updateDoc(escandalloRef, escandalloData);
        Swal.fire(
          '¡Actualizado!',
          'El escandallo ha sido actualizado.',
          'success'
        );
      } else {
        const newEscandalloData = {
          ...escandalloData,
          fechaCreacion: serverTimestamp(),
        };
        await addDoc(
          collection(this.firestore, 'escandallos'),
          newEscandalloData
        );
        Swal.fire(
          '¡Creado!',
          'El nuevo escandallo ha sido guardado.',
          'success'
        );
      }
      this.modal.hide();
      this.escandalloForm.reset();
    } catch (error) {
      console.error('Error al guardar escandallo:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el escandallo.', 'error');
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
      menu: 'bg-danger',
    };
    return clases[categoriaId] || 'bg-secondary';
  }

  getProductoNombre(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  }

  getRecetaNombre(recetaId: string): string {
    const receta = this.recetas.find((r) => r.id === recetaId);
    return receta?.nombre || 'Receta no encontrada';
  }

  onProductoInput(index: number, event: any): void {
    const nombreProducto = event.target.value;
    const producto = this.productos.find(
      (p) => p.nombre.toLowerCase() === nombreProducto.toLowerCase()
    );

    const ingredienteControl = this.ingredientesBase.at(index);
    if (producto) {
      // Buscar la primera merma activa del producto
      const merma = this.mermas.find(
        (m) => m.productoId === producto.id && m.activo
      );

      ingredienteControl.patchValue({
        productoId: producto.id,
        mermaId: merma ? merma.id : '',
      });
    } else {
      ingredienteControl.patchValue({
        productoId: '',
        mermaId: '',
      });
    }
  }

  getMermaPorcentaje(productoId: string): number {
    if (!productoId) return 0;
    const merma = this.mermas.find((m) => m.productoId === productoId);
    return merma ? merma.porcentajeMerma : 0;
  }

  // Métodos para buscador de productos en ingredientes
  filtrarProductosIngrediente(index: number): void {
    const busqueda = this.busquedaProductos[index] || '';
    if (!busqueda.trim()) {
      this.productosFiltradosIngrediente = this.productos.slice(0, 10);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    this.productosFiltradosIngrediente = this.productos
      .filter((p) => p.nombre.toLowerCase().includes(busquedaLower))
      .slice(0, 10);
  }

  seleccionarProductoIngrediente(index: number, producto: Producto): void {
    const ingredienteGroup = this.ingredientesBase.at(index);
    ingredienteGroup.patchValue({ productoId: producto.id });
    this.busquedaProductos[index] = producto.nombre;
    this.mostrarListaProductosIndex = null;
  }

  // Métodos para buscador de recetas
  filtrarRecetasEscandallo(index: number): void {
    const busqueda = this.busquedaRecetas[index] || '';
    if (!busqueda.trim()) {
      this.recetasFiltradas = this.recetas.slice(0, 10);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    this.recetasFiltradas = this.recetas
      .filter((r) => r.nombre.toLowerCase().includes(busquedaLower))
      .slice(0, 10);
  }

  seleccionarRecetaEscandallo(index: number, receta: Receta): void {
    const recetaGroup = this.recetasArray.at(index);
    recetaGroup.patchValue({ recetaId: receta.id });
    this.busquedaRecetas[index] = receta.nombre;
    this.mostrarListaRecetasIndex = null;
  }

  onRecetaInput(index: number, event: any): void {
    const nombreReceta = event.target.value;
    const receta = this.recetas.find(
      (r) => r.nombre.toLowerCase() === nombreReceta.toLowerCase()
    );

    const recetaControl = this.recetasArray.at(index);
    if (receta) {
      recetaControl.patchValue({
        recetaId: receta.id,
      });
    } else {
      recetaControl.patchValue({
        recetaId: '',
      });
    }
  }

  getProductoNombreById(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.nombre || '';
  }

  getRecetaNombreById(recetaId: string): string {
    const receta = this.recetas.find((r) => r.id === recetaId);
    return receta?.nombre || '';
  }

  get costoPreview(): {
    costoTotal: number;
    costoConMermas: number;
    costoPorPorcion: number;
    margen: number;
    margenPorcentaje: number;
  } {
    let costoTotal = 0;
    let costoConMermas = 0;
    const precioVenta = this.escandalloForm.get('precioVenta')?.value || 0;
    const porciones = this.escandalloForm.get('porciones')?.value || 1;

    // Calcular ingredientes base
    this.ingredientesBase.controls.forEach((control) => {
      const productoId = control.get('productoId')?.value;
      const cantidad = control.get('cantidad')?.value || 0;

      if (productoId && cantidad > 0) {
        const producto = this.productos.find((p) => p.id === productoId);
        if (producto && producto.cantidad > 0) {
          const costoPorUnidad = producto.costo / producto.cantidad;
          const costoIngrediente = costoPorUnidad * cantidad;
          costoTotal += costoIngrediente;

          // Aplicar merma si existe
          const merma = this.mermas.find((m) => m.productoId === productoId);
          if (merma) {
            const cantidadConMerma =
              cantidad / (1 - merma.porcentajeMerma / 100);
            costoConMermas += costoPorUnidad * cantidadConMerma;
          } else {
            costoConMermas += costoIngrediente;
          }
        }
      }
    });

    // Calcular recetas
    this.recetasArray.controls.forEach((control) => {
      const recetaId = control.get('recetaId')?.value;
      const cantidad = control.get('cantidad')?.value || 0;

      if (recetaId && cantidad > 0) {
        const receta = this.recetas.find((r) => r.id === recetaId);
        if (receta) {
          const costoReceta = receta.costoPorUnidad * cantidad;
          costoTotal += costoReceta;
          costoConMermas += costoReceta;
        }
      }
    });

    const costoPorPorcion = porciones > 0 ? costoConMermas / porciones : 0;
    const margen = precioVenta - costoPorPorcion;
    const margenPorcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;

    return {
      costoTotal: isFinite(costoTotal) ? costoTotal : 0,
      costoConMermas: isFinite(costoConMermas) ? costoConMermas : 0,
      costoPorPorcion: isFinite(costoPorPorcion) ? costoPorPorcion : 0,
      margen: isFinite(margen) ? margen : 0,
      margenPorcentaje: isFinite(margenPorcentaje) ? margenPorcentaje : 0,
    };
  }
}
