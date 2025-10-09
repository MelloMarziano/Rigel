import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Producto } from '../../../../core/models/producto.model';
import { MermasService, Merma } from '../../../../core/services/mermas.service';

declare var bootstrap: any;

interface MermaExtendida extends Merma {
  productoNombre?: string;
  tipo?: 'cocina' | 'producto';
  cantidadPerdida?: number;
  unidadMedida?: string;
  costoPerdida?: number;
  motivo?: string;
  fechaRegistro?: any;
}

@Component({
  selector: 'app-mermas-page',
  templateUrl: './mermas.page.html',
  styleUrls: ['./mermas.page.scss'],
})
export class MermasPage implements OnInit, OnDestroy {
  mermas: MermaExtendida[] = [];
  mermasFiltradas: MermaExtendida[] = [];
  productos: Producto[] = [];
  mermaForm!: FormGroup;
  modal: any;
  detalleModal: any;
  mermaSeleccionada: MermaExtendida | null = null;

  // Estadísticas
  totalMermas = 0;
  mermasActivas = 0;
  promedioMerma = 0;

  // Para el cálculo dinámico
  cantidadEjemplo = 100;

  // Filtros
  filtroTexto = '';
  filtroEstado = 'todos'; // todos, activo, inactivo
  filtroTipo = 'todos'; // todos, cocina, producto
  filtroProducto = '';

  // Ordenamiento
  ordenarPor: 'nombre' | 'porcentaje' | 'fecha' = 'nombre';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  // Buscador de productos
  busquedaProducto = '';
  productosFiltrados: Producto[] = [];
  mostrarListaProductos = false;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private mermasService: MermasService
  ) {
    this.inicializarForm();
  }

  ngOnInit(): void {
    this.cargarMermas();
    this.cargarProductos();

    const modalEl = document.getElementById('mermaModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }

    const detalleModalEl = document.getElementById('detalleMermaModal');
    if (detalleModalEl) {
      this.detalleModal = new bootstrap.Modal(detalleModalEl);
    }

    // Escuchar cambios en el porcentaje para actualizar el ejemplo
    this.mermaForm.get('porcentajeMerma')?.valueChanges.subscribe(() => {
      this.actualizarEjemplo();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private inicializarForm(): void {
    this.mermaForm = this.fb.group({
      id: [''],
      tipo: ['cocina', Validators.required],
      productoId: ['', Validators.required],
      nombre: [''], // Opcional
      descripcion: [''], // Opcional
      porcentajeMerma: [0],
      cantidadPerdida: [0],
      motivo: [''],
      activo: [true],
    });

    // Actualizar validaciones según el tipo
    this.mermaForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      this.actualizarValidacionesPorTipo(tipo);
    });
  }

  private actualizarValidacionesPorTipo(tipo: 'cocina' | 'producto'): void {
    const porcentajeControl = this.mermaForm.get('porcentajeMerma');
    const cantidadControl = this.mermaForm.get('cantidadPerdida');
    const motivoControl = this.mermaForm.get('motivo');

    if (tipo === 'cocina') {
      porcentajeControl?.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]);
      cantidadControl?.clearValidators();
      motivoControl?.clearValidators();
    } else {
      porcentajeControl?.clearValidators();
      cantidadControl?.setValidators([Validators.required, Validators.min(0)]);
      motivoControl?.setValidators([Validators.required]);
    }

    porcentajeControl?.updateValueAndValidity();
    cantidadControl?.updateValueAndValidity();
    motivoControl?.updateValueAndValidity();
  }

  private cargarMermas(): void {
    this.subscriptions.add(
      this.mermasService.getMermas().subscribe((data) => {
        this.mermas = data;
        this.aplicarFiltros();
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
        }
      )
    );
  }

  private calcularEstadisticas(): void {
    this.totalMermas = this.mermas.length;
    this.mermasActivas = this.mermas.filter((m) => m.activo).length;

    if (this.mermas.length > 0) {
      const suma = this.mermas.reduce((acc, m) => acc + m.porcentajeMerma, 0);
      this.promedioMerma = suma / this.mermas.length;
    } else {
      this.promedioMerma = 0;
    }
  }

  abrirModalNuevo(): void {
    this.mermaForm.reset({
      id: '',
      tipo: 'cocina', // Por defecto cocina
      productoId: '',
      nombre: '',
      descripcion: '',
      porcentajeMerma: 0,
      cantidadPerdida: 0,
      motivo: '',
      activo: true,
    });
    this.busquedaProducto = '';
    this.productosFiltrados = this.productos.slice(0, 10);
    this.mostrarListaProductos = false;
    this.actualizarValidacionesPorTipo('cocina');
    this.modal.show();
  }

  verDetalleMerma(merma: MermaExtendida): void {
    // Agregar nombre del producto
    const producto = this.productos.find((p) => p.id === merma.productoId);
    this.mermaSeleccionada = {
      ...merma,
      productoNombre: producto?.nombre || 'Producto no encontrado',
    };
    this.detalleModal.show();
  }

  editarMerma(merma: MermaExtendida): void {
    this.mermaForm.patchValue(merma);
    const producto = this.productos.find((p) => p.id === merma.productoId);
    this.busquedaProducto = producto?.nombre || '';
    this.mostrarListaProductos = false;
    this.modal.show();
  }

  editarDesdeDetalle(): void {
    if (this.mermaSeleccionada) {
      this.detalleModal.hide();
      this.editarMerma(this.mermaSeleccionada);
    }
  }

  async eliminarMerma(mermaId: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar Merma?',
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
        await this.mermasService.eliminarMerma(mermaId);
        Swal.fire('¡Eliminada!', 'La merma ha sido eliminada.', 'success');
      } catch (error) {
        console.error('Error al eliminar merma:', error);
        Swal.fire('Error', 'No se pudo eliminar la merma.', 'error');
      }
    }
  }

  async eliminarDesdeDetalle(): Promise<void> {
    if (this.mermaSeleccionada?.id) {
      this.detalleModal.hide();
      await this.eliminarMerma(this.mermaSeleccionada.id);
      this.mermaSeleccionada = null;
    }
  }

  async guardarMerma(): Promise<void> {
    if (this.mermaForm.invalid) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos.',
        'error'
      );
      return;
    }

    const formValue = this.mermaForm.value;
    const tipo = formValue.tipo;
    const producto = this.productos.find((p) => p.id === formValue.productoId);

    // Si no hay nombre, usar el nombre del producto
    const nombreMerma =
      formValue.nombre?.trim() ||
      (tipo === 'cocina'
        ? `Merma de ${producto?.nombre}`
        : `Pérdida de ${producto?.nombre}`);

    let mermaData: any = {
      tipo: tipo,
      productoId: formValue.productoId,
      nombre: nombreMerma,
      descripcion: formValue.descripcion || '',
    };

    if (tipo === 'cocina') {
      mermaData.porcentajeMerma = formValue.porcentajeMerma;
      mermaData.activo = formValue.activo;
    } else {
      // Merma de producto
      const cantidadPerdida = formValue.cantidadPerdida;
      const costoPerdida = producto
        ? (producto.costo / producto.cantidad) * cantidadPerdida
        : 0;

      mermaData.cantidadPerdida = cantidadPerdida;
      mermaData.unidadMedida = producto?.unidadMedida || 'unidades';
      mermaData.costoPerdida = costoPerdida;
      mermaData.motivo = formValue.motivo;
      mermaData.fechaRegistro = new Date();
      mermaData.activo = false; // Las mermas de producto no se usan en escandallos
    }

    try {
      if (formValue.id) {
        await this.mermasService.actualizarMerma(formValue.id, mermaData);
        Swal.fire('¡Actualizada!', 'La merma ha sido actualizada.', 'success');
      } else {
        await this.mermasService.crearMerma(mermaData);
        const mensaje =
          tipo === 'cocina'
            ? 'La merma de cocina ha sido guardada.'
            : 'La merma de producto ha sido registrada.';
        Swal.fire('¡Registrada!', mensaje, 'success');
      }
      this.modal.hide();
      this.mermaForm.reset();
    } catch (error) {
      console.error('Error al guardar merma:', error);
      Swal.fire('Error', 'Hubo un problema al guardar la merma.', 'error');
    }
  }

  getProductoNombre(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.nombre || 'Producto no encontrado';
  }

  getProductoCategoria(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.categoriaId || '';
  }

  getProductoUnidadMedida(productoId: string): string {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.unidadMedida || 'unidades';
  }

  getProductoCantidad(productoId: string): number {
    const producto = this.productos.find((p) => p.id === productoId);
    return producto?.cantidad || 1;
  }

  calcularUnidadesUtiles(cantidad: number, porcentaje: number): number {
    return this.mermasService.calcularCantidadUtil(cantidad, porcentaje);
  }

  calcularPerdida(cantidad: number, porcentaje: number): number {
    return this.mermasService.calcularPerdida(cantidad, porcentaje);
  }

  actualizarEjemplo(): void {
    // Este método se llama automáticamente cuando cambia el porcentaje
    // El cálculo se hace en el template
  }

  aplicarFiltros(): void {
    let resultado = [...this.mermas];

    // Filtro por texto (nombre o descripción)
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(
        (m) =>
          m.nombre.toLowerCase().includes(texto) ||
          m.descripcion.toLowerCase().includes(texto) ||
          this.getProductoNombre(m.productoId).toLowerCase().includes(texto)
      );
    }

    // Filtro por tipo
    if (this.filtroTipo !== 'todos') {
      resultado = resultado.filter((m) => m.tipo === this.filtroTipo);
    }

    // Filtro por estado
    if (this.filtroEstado === 'activo') {
      resultado = resultado.filter((m) => m.activo);
    } else if (this.filtroEstado === 'inactivo') {
      resultado = resultado.filter((m) => !m.activo);
    }

    // Filtro por producto
    if (this.filtroProducto) {
      resultado = resultado.filter((m) => m.productoId === this.filtroProducto);
    }

    // Ordenar resultados
    resultado = this.ordenarMermas(resultado);

    this.mermasFiltradas = resultado;
  }

  ordenarMermas(mermas: MermaExtendida[]): MermaExtendida[] {
    return mermas.sort((a, b) => {
      let comparacion = 0;

      switch (this.ordenarPor) {
        case 'nombre':
          comparacion = a.nombre.localeCompare(b.nombre);
          break;
        case 'porcentaje':
          comparacion = a.porcentajeMerma - b.porcentajeMerma;
          break;
        case 'fecha':
          const fechaA = a.fechaCreacion?.toDate?.() || new Date(0);
          const fechaB = b.fechaCreacion?.toDate?.() || new Date(0);
          comparacion = fechaA.getTime() - fechaB.getTime();
          break;
      }

      return this.ordenDireccion === 'asc' ? comparacion : -comparacion;
    });
  }

  cambiarOrden(campo: 'nombre' | 'porcentaje' | 'fecha'): void {
    if (this.ordenarPor === campo) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenarPor = campo;
      this.ordenDireccion = 'asc';
    }
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstado = 'todos';
    this.filtroTipo = 'todos';
    this.filtroProducto = '';
    this.aplicarFiltros();
  }

  calcularCostoPerdida(productoId: string, cantidadPerdida: number): number {
    const producto = this.productos.find((p) => p.id === productoId);
    if (!producto || !cantidadPerdida) return 0;

    const costoPorUnidad = producto.costo / producto.cantidad;
    return costoPorUnidad * cantidadPerdida;
  }

  getMotivoTexto(motivo: string): string {
    const motivos: { [key: string]: string } = {
      rotura: 'Rotura/Caída',
      cancelacion: 'Cancelación de pedido',
      vencimiento: 'Vencimiento',
      deterioro: 'Deterioro/Mal estado',
      error: 'Error de preparación',
      otro: 'Otro',
    };
    return motivos[motivo] || motivo;
  }

  filtrarProductos(): void {
    if (!this.busquedaProducto.trim()) {
      this.productosFiltrados = this.productos.slice(0, 10); // Mostrar primeros 10
      return;
    }

    const busqueda = this.busquedaProducto.toLowerCase();
    this.productosFiltrados = this.productos
      .filter((p) => p.nombre.toLowerCase().includes(busqueda))
      .slice(0, 10); // Limitar a 10 resultados
  }

  seleccionarProducto(producto: Producto): void {
    this.mermaForm.patchValue({ productoId: producto.id });
    this.busquedaProducto = producto.nombre;
    this.mostrarListaProductos = false;
  }

  getMermaPorProducto(productoId: string): MermaExtendida | undefined {
    return this.mermas.find((m) => m.productoId === productoId && m.activo);
  }

  calcularCantidadConMerma(productoId: string, cantidad: number): number {
    const merma = this.getMermaPorProducto(productoId);
    if (merma) {
      return this.mermasService.calcularCantidadUtil(
        cantidad,
        merma.porcentajeMerma
      );
    }
    return cantidad;
  }
}
