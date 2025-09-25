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
  Albaran,
  ProductoAlbaran,
  EstadisticasAlbaranes,
} from '../../../../core/models/albaran.model';
import { Producto } from '../../../../core/models/producto.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-albaranes-page',
  templateUrl: './albaranes.page.html',
  styleUrls: ['./albaranes.page.scss'],
})
export class AlbaranesPage implements OnInit, OnDestroy {
  albaranes: Albaran[] = [];
  albaranesFiltrados: Albaran[] = [];
  productos: Producto[] = [];
  productosProveedor: Producto[] = [];
  proveedores: Proveedor[] = [];

  estadisticas: EstadisticasAlbaranes = {
    totalAlbaranes: 0,
    recibidos: 0,
    pendientes: 0,
    valorTotal: 0,
  };

  filtros = {
    busqueda: '',
    estado: '',
  };

  albaranForm!: FormGroup;
  modoEdicion = false;
  albaranEditando: Albaran | null = null;
  subtotalAlbaran = 0;
  ivaAlbaran = 0;
  totalAlbaran = 0;

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
    this.albaranForm = this.fb.group({
      numero: ['', [Validators.required]],
      proveedorId: ['', [Validators.required]],
      estado: ['Pendiente', [Validators.required]],
      fechaEmision: [
        this.formatDateForInput(new Date()),
        [Validators.required],
      ],
      fechaEntrega: [
        this.formatDateForInput(new Date()),
        [Validators.required],
      ],
      recibidoPor: [''],
      observaciones: [''],
      productos: this.fb.array([]),
    });
  }

  get productosFormArray(): FormArray {
    return this.albaranForm.get('productos') as FormArray;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private cargarDatos(): void {
    const albaranesRef = collection(this.firestore, 'albaranes');
    const productosRef = collection(this.firestore, 'productos');
    const proveedoresRef = collection(this.firestore, 'proveedores');

    this.subscriptions.add(
      combineLatest([
        collectionData(albaranesRef, { idField: 'id' }),
        collectionData(productosRef, { idField: 'id' }),
        collectionData(proveedoresRef, { idField: 'id' }),
      ]).subscribe(
        ([albaranes, productos, proveedores]: [any[], any[], any[]]) => {
          this.albaranes = albaranes.map((a) => ({
            ...a,
            fechaEmision: a.fechaEmision?.toDate
              ? a.fechaEmision.toDate()
              : new Date(a.fechaEmision),
            fechaEntrega: a.fechaEntrega?.toDate
              ? a.fechaEntrega.toDate()
              : new Date(a.fechaEntrega),
          }));

          this.productos = productos.filter((p) => !p.esCombinado);
          this.proveedores = proveedores;

          this.actualizarNombresProveedores();
          this.actualizarNombresProductos();
          this.calcularEstadisticas();
          this.aplicarFiltros();
        }
      )
    );
  }

  private actualizarNombresProveedores(): void {
    this.albaranes.forEach((albaran) => {
      const proveedor = this.proveedores.find(
        (p) => p.id === albaran.proveedorId
      );
      if (proveedor) {
        albaran.proveedorNombre = proveedor.nombre;
        albaran.proveedorCif = proveedor.cif;
      }
    });
  }

  private actualizarNombresProductos(): void {
    this.albaranes.forEach((albaran) => {
      if (albaran.productos) {
        albaran.productos.forEach((producto) => {
          const prod = this.productos.find((p) => p.id === producto.productoId);
          if (prod) {
            producto.productoNombre = prod.nombre;
          }
        });
      }
    });
  }

  private calcularEstadisticas(): void {
    this.estadisticas = {
      totalAlbaranes: this.albaranes.length,
      recibidos: this.albaranes.filter((a) => a.estado === 'Recibido').length,
      pendientes: this.albaranes.filter((a) => a.estado === 'Pendiente').length,
      valorTotal: this.albaranes.reduce((acc, a) => acc + (a.total || 0), 0),
    };
  }

  aplicarFiltros(): void {
    let albaranesFiltrados = [...this.albaranes];

    // Filtro por búsqueda
    if (this.filtros.busqueda.trim()) {
      const busqueda = this.filtros.busqueda.toLowerCase().trim();
      albaranesFiltrados = albaranesFiltrados.filter(
        (albaran) =>
          albaran.numero.toLowerCase().includes(busqueda) ||
          (albaran.proveedorNombre || '').toLowerCase().includes(busqueda) ||
          (albaran.proveedorCif || '').toLowerCase().includes(busqueda)
      );
    }

    // Filtro por estado
    if (this.filtros.estado) {
      albaranesFiltrados = albaranesFiltrados.filter(
        (albaran) => albaran.estado === this.filtros.estado
      );
    }

    this.albaranesFiltrados = albaranesFiltrados;
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda: '',
      estado: '',
    };
    this.aplicarFiltros();
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Recibido':
        return 'bg-success';
      case 'Parcial':
        return 'bg-warning text-dark';
      case 'Pendiente':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  abrirModalAlbaran(): void {
    this.modoEdicion = false;
    this.albaranEditando = null;
    this.albaranForm.reset();
    this.productosFormArray.clear();
    this.productosProveedor = [];
    this.subtotalAlbaran = 0;
    this.ivaAlbaran = 0;
    this.totalAlbaran = 0;

    // Generar número de albarán automático
    const numeroAlbaran = this.generarNumeroAlbaran();
    this.albaranForm.patchValue({
      numero: numeroAlbaran,
      estado: 'Pendiente',
      fechaEmision: this.formatDateForInput(new Date()),
      fechaEntrega: this.formatDateForInput(new Date()),
    });

    $('#modalAlbaran').modal('show');
  }

  private generarNumeroAlbaran(): string {
    const year = new Date().getFullYear();
    const count = this.albaranes.length + 1;
    return `ALB-${year}-${count.toString().padStart(3, '0')}`;
  }

  editarAlbaran(albaran: Albaran): void {
    this.modoEdicion = true;
    this.albaranEditando = albaran;

    this.albaranForm.patchValue({
      numero: albaran.numero,
      proveedorId: albaran.proveedorId,
      estado: albaran.estado,
      fechaEmision: this.formatDateForInput(albaran.fechaEmision),
      fechaEntrega: this.formatDateForInput(albaran.fechaEntrega),
      recibidoPor: albaran.recibidoPor || '',
      observaciones: albaran.observaciones || '',
    });

    // Cargar productos del proveedor
    this.onProveedorChange();

    // Limpiar productos existentes
    this.productosFormArray.clear();

    // Agregar productos del albarán
    if (albaran.productos) {
      albaran.productos.forEach((producto) => {
        this.productosFormArray.push(
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
    }

    this.calcularTotales();
    $('#modalAlbaran').modal('show');
  }

  verAlbaran(albaran: Albaran): void {
    Swal.fire({
      title: 'Opciones del Albarán',
      html: `
        <div class="text-start">
          <p class="mb-3">¿Qué deseas hacer con el albarán <strong>"${albaran.numero}"</strong>?</p>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="bi bi-printer me-1"></i> Imprimir',
      denyButtonText: '<i class="bi bi-eye me-1"></i> Ver Detalles',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      denyButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.imprimirAlbaran(albaran);
      } else if (result.isDenied) {
        this.mostrarDetallesAlbaran(albaran);
      }
    });
  }

  private mostrarDetallesAlbaran(albaran: Albaran): void {
    const productosHtml =
      albaran.productos
        ?.map(
          (prod) =>
            `<li>${prod.productoNombre}: ${
              prod.cantidad
            } unidades - ${prod.precioUnitario.toFixed(2)}€/u</li>`
        )
        .join('') || '';

    Swal.fire({
      title: albaran.numero,
      html: `
        <div class="text-start">
          <p><strong>Proveedor:</strong> ${albaran.proveedorNombre}</p>
          <p><strong>CIF:</strong> ${albaran.proveedorCif}</p>
          <p><strong>Estado:</strong> <span class="badge ${this.getEstadoBadgeClass(
            albaran.estado
          )}">${albaran.estado}</span></p>
          <p><strong>Fecha Emisión:</strong> ${albaran.fechaEmision.toLocaleDateString()}</p>
          <p><strong>Fecha Entrega:</strong> ${albaran.fechaEntrega.toLocaleDateString()}</p>
          <p><strong>Total:</strong> ${albaran.total.toFixed(2)}€</p>
          ${
            albaran.recibidoPor
              ? `<p><strong>Recibido por:</strong> ${albaran.recibidoPor}</p>`
              : ''
          }
          ${
            albaran.observaciones
              ? `<p><strong>Observaciones:</strong> ${albaran.observaciones}</p>`
              : ''
          }
          <p><strong>Productos:</strong></p>
          <ul>${productosHtml}</ul>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar',
    });
  }

  private imprimirAlbaran(albaran: Albaran): void {
    const proveedor = this.proveedores.find(
      (p) => p.id === albaran.proveedorId
    );
    const fechaActual = new Date().toLocaleDateString('es-ES');

    const productosRows =
      albaran.productos
        ?.map(
          (prod, index) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${
          index + 1
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
          prod.productoNombre
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${
          prod.cantidad
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${prod.precioUnitario.toFixed(
          2
        )}€</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${prod.total.toFixed(
          2
        )}€</td>
      </tr>
    `
        )
        .join('') || '';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Albarán ${albaran.numero}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-info {
            flex: 1;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
          }
          .document-info {
            text-align: right;
            flex: 1;
          }
          .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .document-number {
            font-size: 14px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 5px 10px;
            border: 1px solid #ddd;
          }
          .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .party {
            flex: 1;
            margin-right: 20px;
          }
          .party:last-child {
            margin-right: 0;
          }
          .party-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
            color: #2c5aa0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
          }
          .party-details {
            font-size: 11px;
            line-height: 1.4;
          }
          .dates-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
          }
          .date-item {
            text-align: center;
          }
          .date-label {
            font-size: 10px;
            color: #666;
            margin-bottom: 3px;
          }
          .date-value {
            font-weight: bold;
            font-size: 12px;
          }
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .products-table th {
            background: #2c5aa0;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
          }
          .products-table th:nth-child(1) { text-align: center; width: 5%; }
          .products-table th:nth-child(2) { width: 50%; }
          .products-table th:nth-child(3) { text-align: center; width: 15%; }
          .products-table th:nth-child(4) { text-align: right; width: 15%; }
          .products-table th:nth-child(5) { text-align: right; width: 15%; }
          .products-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
          }
          .totals {
            float: right;
            width: 300px;
            margin-bottom: 30px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            font-size: 12px;
          }
          .totals .label {
            background: #f8f9fa;
            font-weight: bold;
            text-align: right;
            width: 60%;
          }
          .totals .value {
            text-align: right;
            width: 40%;
          }
          .totals .total-row {
            background: #2c5aa0;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .signature-section {
            clear: both;
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 30px;
          }
          .signature-boxes {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            height: 60px;
            margin-bottom: 10px;
          }
          .signature-label {
            font-size: 11px;
            font-weight: bold;
          }
          .observations {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #2c5aa0;
          }
          .observations-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #2c5aa0;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c5aa0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background: #1e3d6f;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">
          🖨️ Imprimir
        </button>

        <div class="header">
          <div class="company-info">
            <div class="company-name">TU EMPRESA S.L.</div>
            <div class="company-details">
              Dirección de tu empresa<br>
              Ciudad, CP - Provincia<br>
              CIF: B12345678<br>
              Tel: 123 456 789<br>
              Email: info@tuempresa.com
            </div>
          </div>
          <div class="document-info">
            <div class="document-title">ALBARÁN</div>
            <div class="document-number">${albaran.numero}</div>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <div class="party-title">PROVEEDOR</div>
            <div class="party-details">
              <strong>${
                proveedor?.nombre || albaran.proveedorNombre
              }</strong><br>
              ${proveedor?.razonSocial ? `${proveedor.razonSocial}<br>` : ''}
              ${proveedor?.direccion?.calle || 'Dirección no disponible'}<br>
              ${proveedor?.direccion?.codigoPostal || ''} ${
      proveedor?.direccion?.ciudad || ''
    }<br>
              ${
                proveedor?.direccion?.provincia
                  ? `${proveedor.direccion.provincia}<br>`
                  : ''
              }
              CIF: ${proveedor?.cif || albaran.proveedorCif}<br>
              ${
                proveedor?.contacto?.telefono
                  ? `Tel: ${proveedor.contacto.telefono}<br>`
                  : ''
              }
              ${
                proveedor?.contacto?.email
                  ? `Email: ${proveedor.contacto.email}<br>`
                  : ''
              }
              ${
                proveedor?.contacto?.nombre
                  ? `Contacto: ${proveedor.contacto.nombre}`
                  : ''
              }
            </div>
          </div>
          <div class="party">
            <div class="party-title">DESTINATARIO</div>
            <div class="party-details">
              <strong>TU EMPRESA S.L.</strong><br>
              Dirección de tu empresa<br>
              Ciudad, CP - Provincia<br>
              CIF: B12345678<br>
              Tel: 123 456 789
            </div>
          </div>
        </div>

        <div class="dates-info">
          <div class="date-item">
            <div class="date-label">FECHA EMISIÓN</div>
            <div class="date-value">${albaran.fechaEmision.toLocaleDateString(
              'es-ES'
            )}</div>
          </div>
          <div class="date-item">
            <div class="date-label">FECHA ENTREGA</div>
            <div class="date-value">${albaran.fechaEntrega.toLocaleDateString(
              'es-ES'
            )}</div>
          </div>
          <div class="date-item">
            <div class="date-label">ESTADO</div>
            <div class="date-value">${albaran.estado}</div>
          </div>
          <div class="date-item">
            <div class="date-label">FECHA IMPRESIÓN</div>
            <div class="date-value">${fechaActual}</div>
          </div>
        </div>

        <table class="products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>DESCRIPCIÓN</th>
              <th>CANTIDAD</th>
              <th>PRECIO UNIT.</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${productosRows}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td class="label">Subtotal:</td>
              <td class="value">${albaran.subtotal.toFixed(2)}€</td>
            </tr>
            <tr>
              <td class="label">IVA (21%):</td>
              <td class="value">${albaran.iva.toFixed(2)}€</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL:</td>
              <td class="value">${albaran.total.toFixed(2)}€</td>
            </tr>
          </table>
        </div>

        ${
          albaran.observaciones
            ? `
        <div class="observations">
          <div class="observations-title">OBSERVACIONES</div>
          <div>${albaran.observaciones}</div>
        </div>
        `
            : ''
        }

        <div class="signature-section">
          <div style="margin-bottom: 20px;">
            <strong>Condiciones de entrega:</strong> Los productos han sido entregados en perfecto estado y según las especificaciones acordadas.
          </div>

          <div class="signature-boxes">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">FIRMA DEL PROVEEDOR</div>
              <div style="font-size: 10px; margin-top: 5px;">
                ${proveedor?.nombre || albaran.proveedorNombre}<br>
                Fecha: _______________
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">FIRMA DEL RECEPTOR</div>
              <div style="font-size: 10px; margin-top: 5px;">
                ${albaran.recibidoPor || 'Nombre: _______________'}<br>
                Fecha: _______________
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          Este documento certifica la recepción de los productos detallados en las condiciones especificadas.
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    }
  }

  async eliminarAlbaran(albaran: Albaran): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar albarán?',
      html: `
        <div class="text-start">
          <p>¿Estás seguro de que quieres eliminar el albarán <strong>"${albaran.numero}"</strong>?</p>
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

    if (result.isConfirmed && albaran.id) {
      try {
        const albaranRef = doc(this.firestore, 'albaranes', albaran.id);
        await deleteDoc(albaranRef);

        Swal.fire({
          title: '¡Eliminado!',
          text: 'El albarán ha sido eliminado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error al eliminar albarán:', error);
        Swal.fire('Error', 'No se pudo eliminar el albarán', 'error');
      }
    }
  }

  onProveedorChange(): void {
    const proveedorId = this.albaranForm.get('proveedorId')?.value;
    if (proveedorId) {
      this.productosProveedor = this.productos.filter(
        (p) => p.proveedorId === proveedorId
      );
    } else {
      this.productosProveedor = [];
    }

    // Limpiar productos si cambia el proveedor
    if (!this.modoEdicion) {
      this.productosFormArray.clear();
    }
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
    const productoId = this.productosFormArray
      .at(index)
      .get('productoId')?.value;
    const producto = this.productos.find((p) => p.id === productoId);

    if (producto) {
      // Establecer precio unitario basado en el costo del producto
      this.productosFormArray.at(index).patchValue({
        precioUnitario: producto.costo,
      });
      this.calcularTotales();
    }
  }

  getProductoTotal(index: number): number {
    const producto = this.productosFormArray.at(index);
    const cantidad = producto.get('cantidad')?.value || 0;
    const precio = producto.get('precioUnitario')?.value || 0;
    return cantidad * precio;
  }

  calcularTotales(): void {
    this.subtotalAlbaran = 0;

    for (let i = 0; i < this.productosFormArray.length; i++) {
      this.subtotalAlbaran += this.getProductoTotal(i);
    }

    this.ivaAlbaran = this.subtotalAlbaran * 0.21; // IVA 21%
    this.totalAlbaran = this.subtotalAlbaran + this.ivaAlbaran;
  }

  async guardarAlbaran(): Promise<void> {
    if (!this.albaranForm.valid) {
      Swal.fire(
        'Error',
        'Por favor completa todos los campos requeridos',
        'error'
      );
      return;
    }

    if (this.productosFormArray.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un producto', 'error');
      return;
    }

    const formValue = this.albaranForm.value;
    const productos: ProductoAlbaran[] = formValue.productos.map((p: any) => ({
      productoId: p.productoId,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      total: p.cantidad * p.precioUnitario,
    }));

    const albaranData: Albaran = {
      numero: formValue.numero,
      proveedorId: formValue.proveedorId,
      estado: formValue.estado,
      fechaEmision: new Date(formValue.fechaEmision),
      fechaEntrega: new Date(formValue.fechaEntrega),
      recibidoPor: formValue.recibidoPor,
      observaciones: formValue.observaciones,
      productos: productos,
      subtotal: this.subtotalAlbaran,
      iva: this.ivaAlbaran,
      total: this.totalAlbaran,
      fechaActualizacion: new Date(),
    };

    try {
      if (this.modoEdicion && this.albaranEditando?.id) {
        const albaranRef = doc(
          this.firestore,
          'albaranes',
          this.albaranEditando.id
        );
        await updateDoc(albaranRef, this.cleanObjectForFirebase(albaranData));
        Swal.fire('¡Éxito!', 'Albarán actualizado correctamente', 'success');
      } else {
        albaranData.fechaCreacion = new Date();
        const albaranesRef = collection(this.firestore, 'albaranes');
        await addDoc(albaranesRef, this.cleanObjectForFirebase(albaranData));
        Swal.fire('¡Éxito!', 'Albarán creado correctamente', 'success');
      }

      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar albarán:', error);
      Swal.fire('Error', 'No se pudo guardar el albarán', 'error');
    }
  }

  cerrarModal(): void {
    $('#modalAlbaran').modal('hide');
    this.albaranForm.reset();
    this.productosFormArray.clear();
    this.modoEdicion = false;
    this.albaranEditando = null;
    this.productosProveedor = [];
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
