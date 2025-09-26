import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface ReporteVenta {
  id: string;
  fecha: Date;
  total: number;
  productos: any[];
  cliente?: string;
  metodoPago: string;
}

interface ReporteProducto {
  nombre: string;
  cantidadVendida: number;
  ingresoTotal: number;
  categoria: string;
}

interface ReporteAlbaran {
  id: string;
  fecha: Date;
  proveedor: string;
  numeroAlbaran: string;
  total: number;
  productos: any[];
  estado: string;
}

@Component({
  selector: 'app-reportes-page',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
})
export class ReportesPage implements OnInit {
  filtrosForm!: FormGroup;
  tipoReporte: string = 'ventas';
  reporteVentas: ReporteVenta[] = [];
  reporteProductos: ReporteProducto[] = [];
  reporteAlbaranes: ReporteAlbaran[] = [];
  resumenVentas = {
    totalVentas: 0,
    totalIngresos: 0,
    ventaPromedio: 0,
    productosVendidos: 0,
  };
  resumenAlbaranes = {
    totalAlbaranes: 0,
    totalCompras: 0,
    compraPromedio: 0,
    productosComprados: 0,
  };
  cargando = false;
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setFechasDefault();
    this.generarReporte();
  }

  private initForm(): void {
    this.filtrosForm = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      tipoReporte: ['ventas'],
    });
  }

  private setFechasDefault(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.fechaInicio = inicioMes.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];

    this.filtrosForm.patchValue({
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
    });
  }

  onTipoReporteChange(tipo: string): void {
    this.tipoReporte = tipo;
    this.filtrosForm.patchValue({ tipoReporte: tipo });
    this.generarReporte();
  }

  async generarReporte(): Promise<void> {
    this.cargando = true;

    try {
      const filtros = this.filtrosForm.value;
      this.fechaInicio = filtros.fechaInicio;
      this.fechaFin = filtros.fechaFin;

      if (this.tipoReporte === 'ventas') {
        await this.generarReporteVentas();
      } else if (this.tipoReporte === 'productos') {
        await this.generarReporteProductos();
      } else if (this.tipoReporte === 'albaranes') {
        await this.generarReporteAlbaranes();
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
    } finally {
      this.cargando = false;
    }
  }

  private async generarReporteVentas(): Promise<void> {
    // Simular datos de ventas - en producción vendría de Firebase
    const ventasSimuladas: ReporteVenta[] = [
      {
        id: '1',
        fecha: new Date('2024-01-15'),
        total: 45.5,
        productos: [
          { nombre: 'Pizza Margherita', cantidad: 1, precio: 12.5 },
          { nombre: 'Ensalada César', cantidad: 2, precio: 8.5 },
          { nombre: 'Coca Cola', cantidad: 3, precio: 2.5 },
        ],
        cliente: 'Juan Pérez',
        metodoPago: 'Tarjeta',
      },
      {
        id: '2',
        fecha: new Date('2024-01-15'),
        total: 28.75,
        productos: [
          { nombre: 'Hamburguesa Clásica', cantidad: 1, precio: 15.25 },
          { nombre: 'Papas Fritas', cantidad: 1, precio: 4.5 },
          { nombre: 'Agua', cantidad: 2, precio: 1.5 },
        ],
        metodoPago: 'Efectivo',
      },
      {
        id: '3',
        fecha: new Date('2024-01-16'),
        total: 67.2,
        productos: [
          { nombre: 'Paella Valenciana', cantidad: 2, precio: 22.5 },
          { nombre: 'Sangría', cantidad: 1, precio: 12.2 },
          { nombre: 'Flan', cantidad: 2, precio: 5.0 },
        ],
        cliente: 'María García',
        metodoPago: 'Tarjeta',
      },
    ];

    this.reporteVentas = this.filtrarVentasPorFecha(ventasSimuladas);
    this.calcularResumenVentas();
  }

  private async generarReporteProductos(): Promise<void> {
    // Generar reporte de productos basado en las ventas
    const productosMap = new Map<string, ReporteProducto>();

    this.reporteVentas.forEach((venta) => {
      venta.productos.forEach((producto) => {
        const key = producto.nombre;
        if (productosMap.has(key)) {
          const existing = productosMap.get(key)!;
          existing.cantidadVendida += producto.cantidad;
          existing.ingresoTotal += producto.precio * producto.cantidad;
        } else {
          productosMap.set(key, {
            nombre: producto.nombre,
            cantidadVendida: producto.cantidad,
            ingresoTotal: producto.precio * producto.cantidad,
            categoria: this.obtenerCategoria(producto.nombre),
          });
        }
      });
    });

    this.reporteProductos = Array.from(productosMap.values()).sort(
      (a, b) => b.ingresoTotal - a.ingresoTotal
    );
  }

  private filtrarVentasPorFecha(ventas: ReporteVenta[]): ReporteVenta[] {
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59, 999);

    return ventas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicio && fechaVenta <= fin;
    });
  }

  private calcularResumenVentas(): void {
    this.resumenVentas.totalVentas = this.reporteVentas.length;
    this.resumenVentas.totalIngresos = this.reporteVentas.reduce(
      (sum, venta) => sum + venta.total,
      0
    );
    this.resumenVentas.ventaPromedio =
      this.resumenVentas.totalVentas > 0
        ? this.resumenVentas.totalIngresos / this.resumenVentas.totalVentas
        : 0;
    this.resumenVentas.productosVendidos = this.reporteVentas.reduce(
      (sum, venta) =>
        sum +
        venta.productos.reduce((prodSum, prod) => prodSum + prod.cantidad, 0),
      0
    );
  }

  private obtenerCategoria(nombreProducto: string): string {
    const categorias: { [key: string]: string } = {
      Pizza: 'Pizzas',
      Hamburguesa: 'Hamburguesas',
      Ensalada: 'Ensaladas',
      Paella: 'Arroces',
      'Coca Cola': 'Bebidas',
      Agua: 'Bebidas',
      Sangría: 'Bebidas',
      Papas: 'Acompañamientos',
      Flan: 'Postres',
    };

    for (const [key, categoria] of Object.entries(categorias)) {
      if (nombreProducto.includes(key)) {
        return categoria;
      }
    }
    return 'Otros';
  }

  exportarReporte(): void {
    if (this.tipoReporte === 'ventas') {
      this.exportarReporteVentas();
    } else if (this.tipoReporte === 'productos') {
      this.exportarReporteProductos();
    } else if (this.tipoReporte === 'albaranes') {
      this.exportarReporteAlbaranes();
    }
  }

  private exportarReporteVentas(): void {
    const csvContent = this.generarCSVVentas();
    this.descargarCSV(
      csvContent,
      `reporte-ventas-${this.fechaInicio}-${this.fechaFin}.csv`
    );
  }

  private exportarReporteProductos(): void {
    const csvContent = this.generarCSVProductos();
    this.descargarCSV(
      csvContent,
      `reporte-productos-${this.fechaInicio}-${this.fechaFin}.csv`
    );
  }

  private generarCSVVentas(): string {
    const headers = ['Fecha', 'Total', 'Cliente', 'Método Pago', 'Productos'];
    const rows = this.reporteVentas.map((venta) => [
      venta.fecha.toLocaleDateString(),
      venta.total.toFixed(2),
      venta.cliente || 'Sin cliente',
      venta.metodoPago,
      venta.productos.map((p) => `${p.nombre} (${p.cantidad})`).join('; '),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private generarCSVProductos(): string {
    const headers = [
      'Producto',
      'Cantidad Vendida',
      'Ingreso Total',
      'Categoría',
    ];
    const rows = this.reporteProductos.map((producto) => [
      producto.nombre,
      producto.cantidadVendida.toString(),
      producto.ingresoTotal.toFixed(2),
      producto.categoria,
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private async generarReporteAlbaranes(): Promise<void> {
    // Simular datos de albaranes - en producción vendría de Firebase
    const albaranesSimulados: ReporteAlbaran[] = [
      {
        id: '1',
        fecha: new Date('2024-01-10'),
        proveedor: 'Distribuciones García S.L.',
        numeroAlbaran: 'ALB-2024-001',
        total: 245.8,
        productos: [
          { nombre: 'Tomate', cantidad: 20, precio: 2.5 },
          { nombre: 'Mozzarella', cantidad: 10, precio: 4.8 },
          { nombre: 'Harina', cantidad: 5, precio: 12.5 },
          { nombre: 'Aceite de Oliva', cantidad: 3, precio: 15.6 },
        ],
        estado: 'Recibido',
      },
      {
        id: '2',
        fecha: new Date('2024-01-12'),
        proveedor: 'Carnes Premium S.A.',
        numeroAlbaran: 'ALB-2024-002',
        total: 189.45,
        productos: [
          { nombre: 'Carne de Res', cantidad: 8, precio: 18.5 },
          { nombre: 'Pollo', cantidad: 12, precio: 6.25 },
          { nombre: 'Cerdo', cantidad: 6, precio: 14.8 },
        ],
        estado: 'Recibido',
      },
      {
        id: '3',
        fecha: new Date('2024-01-14'),
        proveedor: 'Verduras Frescas Ltda.',
        numeroAlbaran: 'ALB-2024-003',
        total: 156.3,
        productos: [
          { nombre: 'Lechuga', cantidad: 15, precio: 1.8 },
          { nombre: 'Cebolla', cantidad: 10, precio: 2.2 },
          { nombre: 'Pimiento', cantidad: 8, precio: 3.5 },
          { nombre: 'Zanahoria', cantidad: 12, precio: 1.9 },
        ],
        estado: 'Pendiente',
      },
      {
        id: '4',
        fecha: new Date('2024-01-16'),
        proveedor: 'Bebidas del Norte',
        numeroAlbaran: 'ALB-2024-004',
        total: 98.75,
        productos: [
          { nombre: 'Coca Cola', cantidad: 24, precio: 1.25 },
          { nombre: 'Agua Mineral', cantidad: 36, precio: 0.85 },
          { nombre: 'Cerveza', cantidad: 12, precio: 2.8 },
        ],
        estado: 'Recibido',
      },
    ];

    this.reporteAlbaranes = this.filtrarAlbaranesPorFecha(albaranesSimulados);
    this.calcularResumenAlbaranes();
  }

  private filtrarAlbaranesPorFecha(
    albaranes: ReporteAlbaran[]
  ): ReporteAlbaran[] {
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59, 999);

    return albaranes.filter((albaran) => {
      const fechaAlbaran = new Date(albaran.fecha);
      return fechaAlbaran >= inicio && fechaAlbaran <= fin;
    });
  }

  private calcularResumenAlbaranes(): void {
    this.resumenAlbaranes.totalAlbaranes = this.reporteAlbaranes.length;
    this.resumenAlbaranes.totalCompras = this.reporteAlbaranes.reduce(
      (sum, albaran) => sum + albaran.total,
      0
    );
    this.resumenAlbaranes.compraPromedio =
      this.resumenAlbaranes.totalAlbaranes > 0
        ? this.resumenAlbaranes.totalCompras /
          this.resumenAlbaranes.totalAlbaranes
        : 0;
    this.resumenAlbaranes.productosComprados = this.reporteAlbaranes.reduce(
      (sum, albaran) =>
        sum +
        albaran.productos.reduce((prodSum, prod) => prodSum + prod.cantidad, 0),
      0
    );
  }

  private exportarReporteAlbaranes(): void {
    const csvContent = this.generarCSVAlbaranes();
    this.descargarCSV(
      csvContent,
      `reporte-albaranes-${this.fechaInicio}-${this.fechaFin}.csv`
    );
  }

  private generarCSVAlbaranes(): string {
    const headers = [
      'Fecha',
      'Proveedor',
      'Número Albarán',
      'Total',
      'Estado',
      'Productos',
    ];
    const rows = this.reporteAlbaranes.map((albaran) => [
      albaran.fecha.toLocaleDateString(),
      albaran.proveedor,
      albaran.numeroAlbaran,
      albaran.total.toFixed(2),
      albaran.estado,
      albaran.productos.map((p) => `${p.nombre} (${p.cantidad})`).join('; '),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private descargarCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
