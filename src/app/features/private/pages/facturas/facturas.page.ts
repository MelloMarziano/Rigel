import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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

interface Factura {
  id?: string;
  numero: string;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  estado: 'Borrador' | 'Enviada' | 'Pagada' | 'Vencida' | 'Cancelada';
  metodoPago: string;
  subtotal: number;
  iva: number;
  total: number;
  productos: ProductoFactura[];
  observaciones?: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

interface ProductoFactura {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  ivaProducto: number;
  subtotal: number;
  ivaImporte: number;
  total: number;
}

interface EstadisticasFacturas {
  totalFacturas: number;
  pagadas: number;
  pendientes: number;
  valorTotal: number;
}

interface FiltrosFacturas {
  busqueda: string;
  estado: string;
}

interface IvaBreakdown {
  porcentaje: number;
  importe: number;
}

@Component({
  selector: 'app-facturas-page',
  templateUrl: './facturas.page.html',
  styleUrls: ['./facturas.page.scss'],
})
export class FacturasPage implements OnInit, OnDestroy {
  facturas: Factura[] = [];
  facturasFiltradas: Factura[] = [];
  facturaSeleccionada: Factura | null = null;
  productos: Producto[] = [];

  facturaForm!: FormGroup;
  modoEdicion = false;
  facturaEditando: Factura | null = null;
  modal: any;

  estadisticas: EstadisticasFacturas = {
    totalFacturas: 0,
    pagadas: 0,
    pendientes: 0,
    valorTotal: 0,
  };

  filtros: FiltrosFacturas = {
    busqueda: '',
    estado: '',
  };

  // Cálculos de totales
  subtotalFactura = 0;
  ivaFactura = 0;
  totalFactura = 0;
  ivaBreakdown: IvaBreakdown[] = [];

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarProductos();
    this.initModal();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initForm(): void {
    this.facturaForm = this.fb.group({
      numero: ['', Validators.required],
      clienteNombre: ['', Validators.required],
      clienteEmail: [''],
      clienteTelefono: [''],
      fechaEmision: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      fechaVencimiento: [
        this.getFechaVencimientoDefault(),
        Validators.required,
      ],
      estado: ['Borrador'],
      metodoPago: ['Efectivo'],
      observaciones: [''],
      productos: this.fb.array([]),
    });
  }

  private getFechaVencimientoDefault(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30); // 30 días por defecto
    return fecha.toISOString().split('T')[0];
  }

  private initModal(): void {
    const modalEl = document.getElementById('modalFactura');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  private cargarFacturas(): void {
    const facturasRef = collection(this.firestore, 'facturas');
    this.subscriptions.add(
      collectionData(facturasRef, { idField: 'id' }).subscribe((data: any) => {
        this.facturas = data.map((factura: any) => ({
          ...factura,
          fechaEmision: factura.fechaEmision?.toDate() || new Date(),
          fechaVencimiento: factura.fechaVencimiento?.toDate() || new Date(),
        }));
        this.actualizarEstadisticas();
        this.aplicarFiltros();
      })
    );
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe((data: any) => {
        this.productos = data;
      })
    );
  }

  private actualizarEstadisticas(): void {
    this.estadisticas.totalFacturas = this.facturas.length;
    this.estadisticas.pagadas = this.facturas.filter(
      (f) => f.estado === 'Pagada'
    ).length;
    this.estadisticas.pendientes = this.facturas.filter(
      (f) => f.estado === 'Enviada' || f.estado === 'Vencida'
    ).length;
    this.estadisticas.valorTotal = this.facturas.reduce(
      (sum, f) => sum + f.total,
      0
    );
  }

  get productosFormArray(): FormArray {
    return this.facturaForm.get('productos') as FormArray;
  }

  aplicarFiltros(): void {
    let facturasFiltradas = [...this.facturas];

    if (this.filtros.busqueda) {
      const busqueda = this.filtros.busqueda.toLowerCase();
      facturasFiltradas = facturasFiltradas.filter(
        (factura) =>
          factura.numero.toLowerCase().includes(busqueda) ||
          factura.clienteNombre.toLowerCase().includes(busqueda) ||
          (factura.clienteEmail &&
            factura.clienteEmail.toLowerCase().includes(busqueda))
      );
    }

    if (this.filtros.estado) {
      facturasFiltradas = facturasFiltradas.filter(
        (factura) => factura.estado === this.filtros.estado
      );
    }

    this.facturasFiltradas = facturasFiltradas;
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda: '',
      estado: '',
    };
    this.aplicarFiltros();
  }

  abrirModalFactura(): void {
    this.modoEdicion = false;
    this.facturaEditando = null;
    this.resetForm();
    this.generarNumeroFactura();
    this.modal.show();
  }

  private generarNumeroFactura(): void {
    const año = new Date().getFullYear();
    const numeroSecuencial = this.facturas.length + 1;
    const numero = `FAC-${año}-${numeroSecuencial.toString().padStart(3, '0')}`;
    this.facturaForm.patchValue({ numero });
  }

  editarFactura(factura: Factura): void {
    if (factura.estado === 'Pagada') {
      Swal.fire('Error', 'No se puede editar una factura pagada', 'error');
      return;
    }

    this.modoEdicion = true;
    this.facturaEditando = factura;
    this.cargarFacturaEnFormulario(factura);
    this.modal.show();
  }

  private cargarFacturaEnFormulario(factura: Factura): void {
    this.facturaForm.patchValue({
      numero: factura.numero,
      clienteNombre: factura.clienteNombre,
      clienteEmail: factura.clienteEmail || '',
      clienteTelefono: factura.clienteTelefono || '',
      fechaEmision: factura.fechaEmision.toISOString().split('T')[0],
      fechaVencimiento: factura.fechaVencimiento.toISOString().split('T')[0],
      estado: factura.estado,
      metodoPago: factura.metodoPago,
      observaciones: factura.observaciones || '',
    });

    // Cargar productos
    const productosArray = this.productosFormArray;
    productosArray.clear();

    factura.productos.forEach((producto) => {
      productosArray.push(
        this.fb.group({
          productoId: [producto.productoId, Validators.required],
          cantidad: [
            producto.cantidad,
            [Validators.required, Validators.min(1)],
          ],
          precioUnitario: [
            producto.precioUnitario,
            [Validators.required, Validators.min(0)],
          ],
        })
      );
    });

    this.calcularTotales();
  }

  agregarProducto(): void {
    const productoGroup = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
    });

    this.productosFormArray.push(productoGroup);
  }

  eliminarProducto(index: number): void {
    this.productosFormArray.removeAt(index);
    this.calcularTotales();
  }

  onProductoChange(index: number): void {
    const productoControl = this.productosFormArray.at(index);
    const productoId = productoControl.get('productoId')?.value;

    if (productoId) {
      const producto = this.productos.find((p) => p.id === productoId);
      if (producto) {
        // Calcular precio de venta con IVA
        const precioConIva = producto.costo * (1 + (producto.IVA || 0) / 100);
        productoControl.patchValue({
          precioUnitario: precioConIva,
        });
        this.calcularTotales();
      }
    }
  }

  calcularTotales(): void {
    let subtotal = 0;
    const ivaMap = new Map<number, number>();

    this.productosFormArray.controls.forEach((control, index) => {
      const productoId = control.get('productoId')?.value;
      const cantidad = control.get('cantidad')?.value || 0;
      const precioUnitario = control.get('precioUnitario')?.value || 0;

      if (productoId && cantidad && precioUnitario) {
        const producto = this.productos.find((p) => p.id === productoId);
        const ivaProducto = producto?.IVA || 0;

        const subtotalProducto = cantidad * precioUnitario;
        const ivaImporte = subtotalProducto * (ivaProducto / 100);

        subtotal += subtotalProducto;

        // Acumular IVA por porcentaje
        if (ivaMap.has(ivaProducto)) {
          ivaMap.set(ivaProducto, ivaMap.get(ivaProducto)! + ivaImporte);
        } else {
          ivaMap.set(ivaProducto, ivaImporte);
        }
      }
    });

    this.subtotalFactura = subtotal;
    this.ivaFactura = Array.from(ivaMap.values()).reduce(
      (sum, iva) => sum + iva,
      0
    );
    this.totalFactura = this.subtotalFactura + this.ivaFactura;

    // Crear breakdown de IVA
    this.ivaBreakdown = Array.from(ivaMap.entries()).map(
      ([porcentaje, importe]) => ({
        porcentaje,
        importe,
      })
    );
  }

  getProductoSubtotal(index: number): number {
    const control = this.productosFormArray.at(index);
    const cantidad = control.get('cantidad')?.value || 0;
    const precio = control.get('precioUnitario')?.value || 0;
    return cantidad * precio;
  }

  getProductoIvaImporte(index: number): number {
    const control = this.productosFormArray.at(index);
    const productoId = control.get('productoId')?.value;

    if (productoId) {
      const producto = this.productos.find((p) => p.id === productoId);
      const ivaProducto = producto?.IVA || 0;
      const subtotal = this.getProductoSubtotal(index);
      return subtotal * (ivaProducto / 100);
    }
    return 0;
  }

  getProductoTotal(index: number): number {
    return this.getProductoSubtotal(index) + this.getProductoIvaImporte(index);
  }

  async guardarFactura(): Promise<void> {
    if (!this.facturaForm.valid) {
      Swal.fire(
        'Error',
        'Por favor complete todos los campos requeridos',
        'error'
      );
      return;
    }

    if (this.productosFormArray.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
      return;
    }

    try {
      Swal.showLoading();

      const formValue = this.facturaForm.value;
      const productos: ProductoFactura[] = [];

      // Procesar productos
      this.productosFormArray.controls.forEach((control, index) => {
        const productoId = control.get('productoId')?.value;
        const cantidad = control.get('cantidad')?.value;
        const precioUnitario = control.get('precioUnitario')?.value;

        if (productoId && cantidad && precioUnitario) {
          const producto = this.productos.find((p) => p.id === productoId);
          const ivaProducto = producto?.IVA || 0;
          const subtotal = cantidad * precioUnitario;
          const ivaImporte = subtotal * (ivaProducto / 100);

          productos.push({
            productoId,
            productoNombre: producto?.nombre || '',
            cantidad,
            precioUnitario,
            ivaProducto,
            subtotal,
            ivaImporte,
            total: subtotal + ivaImporte,
          });
        }
      });

      const facturaData: Partial<Factura> = {
        numero: formValue.numero,
        clienteNombre: formValue.clienteNombre,
        clienteEmail: formValue.clienteEmail,
        clienteTelefono: formValue.clienteTelefono,
        fechaEmision: new Date(formValue.fechaEmision),
        fechaVencimiento: new Date(formValue.fechaVencimiento),
        estado: formValue.estado,
        metodoPago: formValue.metodoPago,
        subtotal: this.subtotalFactura,
        iva: this.ivaFactura,
        total: this.totalFactura,
        productos,
        observaciones: formValue.observaciones,
      };

      if (this.modoEdicion && this.facturaEditando?.id) {
        facturaData.fechaActualizacion = serverTimestamp() as any;
        const facturaRef = doc(
          this.firestore,
          'facturas',
          this.facturaEditando.id
        );
        await updateDoc(facturaRef, facturaData);

        Swal.fire(
          '¡Actualizada!',
          'La factura ha sido actualizada exitosamente',
          'success'
        );
      } else {
        facturaData.fechaCreacion = serverTimestamp() as any;
        await addDoc(collection(this.firestore, 'facturas'), facturaData);

        Swal.fire(
          '¡Creada!',
          'La factura ha sido creada exitosamente',
          'success'
        );
      }

      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar factura:', error);
      Swal.fire('Error', 'Hubo un problema al guardar la factura', 'error');
    }
  }

  async eliminarFactura(factura: Factura): Promise<void> {
    if (factura.estado === 'Pagada') {
      Swal.fire('Error', 'No se puede eliminar una factura pagada', 'error');
      return;
    }

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

    if (result.isConfirmed && factura.id) {
      try {
        await deleteDoc(doc(this.firestore, 'facturas', factura.id));
        Swal.fire('¡Eliminada!', 'La factura ha sido eliminada', 'success');
      } catch (error) {
        console.error('Error al eliminar factura:', error);
        Swal.fire('Error', 'No se pudo eliminar la factura', 'error');
      }
    }
  }

  verFactura(factura: Factura): void {
    // Implementar vista detallada de factura
    console.log('Ver factura:', factura);
  }

  imprimirFactura(factura: Factura): void {
    // Implementar impresión de factura
    console.log('Imprimir factura:', factura);
  }

  async enviarFactura(factura: Factura): Promise<void> {
    if (factura.id) {
      try {
        const facturaRef = doc(this.firestore, 'facturas', factura.id);
        await updateDoc(facturaRef, {
          estado: 'Enviada',
          fechaActualizacion: serverTimestamp(),
        });
        Swal.fire(
          '¡Enviada!',
          'La factura ha sido marcada como enviada',
          'success'
        );
      } catch (error) {
        Swal.fire('Error', 'No se pudo enviar la factura', 'error');
      }
    }
  }

  async marcarComoPagada(factura: Factura): Promise<void> {
    if (factura.id) {
      try {
        const facturaRef = doc(this.firestore, 'facturas', factura.id);
        await updateDoc(facturaRef, {
          estado: 'Pagada',
          fechaActualizacion: serverTimestamp(),
        });
        Swal.fire(
          '¡Pagada!',
          'La factura ha sido marcada como pagada',
          'success'
        );
      } catch (error) {
        Swal.fire('Error', 'No se pudo marcar como pagada', 'error');
      }
    }
  }

  async cancelarFactura(factura: Factura): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar factura?',
      text: 'Esta acción marcará la factura como cancelada',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    });

    if (result.isConfirmed && factura.id) {
      try {
        const facturaRef = doc(this.firestore, 'facturas', factura.id);
        await updateDoc(facturaRef, {
          estado: 'Cancelada',
          fechaActualizacion: serverTimestamp(),
        });
        Swal.fire('¡Cancelada!', 'La factura ha sido cancelada', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo cancelar la factura', 'error');
      }
    }
  }

  seleccionarClienteExistente(): void {
    // Implementar selector de clientes existentes
    console.log('Seleccionar cliente existente');
  }

  cerrarModal(): void {
    this.modal.hide();
    this.resetForm();
  }

  private resetForm(): void {
    this.facturaForm.reset({
      numero: '',
      clienteNombre: '',
      clienteEmail: '',
      clienteTelefono: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: this.getFechaVencimientoDefault(),
      estado: 'Borrador',
      metodoPago: 'Efectivo',
      observaciones: '',
    });

    this.productosFormArray.clear();
    this.subtotalFactura = 0;
    this.ivaFactura = 0;
    this.totalFactura = 0;
    this.ivaBreakdown = [];
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      Borrador: 'bg-secondary',
      Enviada: 'bg-info',
      Pagada: 'bg-success',
      Vencida: 'bg-danger',
      Cancelada: 'bg-dark',
    };
    return clases[estado] || 'bg-secondary';
  }

  isFacturaVencida(factura: Factura): boolean {
    const hoy = new Date();
    return factura.fechaVencimiento < hoy && factura.estado !== 'Pagada';
  }

  // Método para ver detalle de factura
  verDetalleFactura(factura: Factura): void {
    this.facturaSeleccionada = factura;
    const modalEl = document.getElementById('detalleFacturaModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Método para editar desde el modal de detalle
  editarDesdeDetalle(): void {
    if (this.facturaSeleccionada) {
      // Cerrar modal de detalle
      const detalleModalEl = document.getElementById('detalleFacturaModal');
      if (detalleModalEl) {
        const detalleModal = bootstrap.Modal.getInstance(detalleModalEl);
        if (detalleModal) {
          detalleModal.hide();
        }
      }

      // Esperar a que se cierre el modal antes de abrir el de edición
      setTimeout(() => {
        this.editarFactura(this.facturaSeleccionada!);
      }, 300);
    }
  }

  // Método para eliminar desde el modal de detalle
  async eliminarDesdeDetalle(): Promise<void> {
    if (this.facturaSeleccionada) {
      // Cerrar modal de detalle
      const detalleModalEl = document.getElementById('detalleFacturaModal');
      if (detalleModalEl) {
        const detalleModal = bootstrap.Modal.getInstance(detalleModalEl);
        if (detalleModal) {
          detalleModal.hide();
        }
      }

      // Esperar a que se cierre el modal antes de mostrar la confirmación
      setTimeout(async () => {
        await this.eliminarFactura(this.facturaSeleccionada!);
      }, 300);
    }
  }

  // Método para imprimir desde el modal de detalle
  imprimirDesdeDetalle(): void {
    if (this.facturaSeleccionada) {
      this.imprimirFactura(this.facturaSeleccionada);
    }
  }
}
