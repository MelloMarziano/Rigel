import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  totalProductos = 0;
  productosActivos = 0;
  productosBajosEnStock = 0;
  totalStockValue = 0;
  totalCategorias = 0;
  totalProveedores = 0;
  fechaActualizacion = new Date();

  // Chart data
  categoriaChartData: any = { labels: [], datasets: [] };
  categoriaChartOptions: any = {};
  stockChartData: any = { labels: [], datasets: [] };
  stockChartOptions: any = {};
  proveedorChartData: any = { labels: [], datasets: [] };
  proveedorChartOptions: any = {};

  // Lists for detailed analysis
  topProductosValiosos: any[] = [];
  productosStockCritico: any[] = [];
  topProveedores: any[] = [];

  // Data arrays
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];

  private subscriptions = new Subscription();

  constructor(private firestore: Firestore) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.inicializarChartOptions();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cargarDatos(): void {
    const productosRef = collection(this.firestore, 'productos');
    const categoriasRef = collection(this.firestore, 'categorias');
    const proveedoresRef = collection(this.firestore, 'proveedores');

    this.subscriptions.add(
      combineLatest([
        collectionData(productosRef, { idField: 'id' }),
        collectionData(categoriasRef, { idField: 'id' }),
        collectionData(proveedoresRef, { idField: 'id' }),
      ]).subscribe(
        ([productos, categorias, proveedores]: [any[], any[], any[]]) => {
          this.productos = productos;
          this.categorias = categorias;
          this.proveedores = proveedores;

          this.calcularEstadisticas();
          this.actualizarCharts();
          this.fechaActualizacion = new Date();
        }
      )
    );
  }

  private calcularEstadisticas(): void {
    this.totalProductos = this.productos.length;
    this.totalCategorias = this.categorias.length;
    this.totalProveedores = this.proveedores.length;

    this.productosActivos = this.productos.filter(
      (p) => !p.esCombinado && (p.stock || 0) > 0
    ).length;

    this.productosBajosEnStock = this.productos.filter(
      (p) =>
        !p.esCombinado &&
        p.stock !== undefined &&
        p.stockMinimo !== undefined &&
        p.stock <= p.stockMinimo
    ).length;

    this.totalStockValue = this.productos.reduce(
      (acc, p) => acc + (p.stock || 0) * (p.costo || 0),
      0
    );

    // Calcular productos más valiosos
    this.topProductosValiosos = this.productos
      .filter((p) => !p.esCombinado)
      .map((p) => ({
        ...p,
        valorTotal: (p.stock || 0) * (p.costo || 0),
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);

    // Productos con stock crítico
    this.productosStockCritico = this.productos
      .filter(
        (p) =>
          !p.esCombinado &&
          p.stock !== undefined &&
          p.stockMinimo !== undefined &&
          p.stock <= p.stockMinimo
      )
      .slice(0, 10);

    // Top proveedores
    const proveedorStats = this.proveedores.map((proveedor) => ({
      ...proveedor,
      totalProductos: this.productos.filter(
        (p) => p.proveedorId === proveedor.id
      ).length,
    }));

    this.topProveedores = proveedorStats
      .sort((a, b) => b.totalProductos - a.totalProductos)
      .slice(0, 4);
  }

  private actualizarCharts(): void {
    this.actualizarCategoriaChart();
    this.actualizarStockChart();
    this.actualizarProveedorChart();
  }

  private actualizarCategoriaChart(): void {
    const categoriaStats = this.categorias.map((categoria) => ({
      nombre: categoria.nombre,
      total: this.productos.filter((p) => p.categoriaId === categoria.id)
        .length,
    }));

    this.categoriaChartData = {
      labels: categoriaStats.map((c) => c.nombre),
      datasets: [
        {
          data: categoriaStats.map((c) => c.total),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF',
          ],
        },
      ],
    };
  }

  private actualizarStockChart(): void {
    const stockStats = this.categorias.map((categoria) => ({
      nombre: categoria.nombre,
      stock: this.productos
        .filter((p) => p.categoriaId === categoria.id && !p.esCombinado)
        .reduce((acc, p) => acc + (p.stock || 0), 0),
    }));

    this.stockChartData = {
      labels: stockStats.map((s) => s.nombre),
      datasets: [
        {
          label: 'Stock Total',
          data: stockStats.map((s) => s.stock),
          backgroundColor: '#36A2EB',
        },
      ],
    };
  }

  private actualizarProveedorChart(): void {
    const proveedorStats = this.proveedores
      .map((proveedor) => ({
        nombre: proveedor.nombre,
        total: this.productos.filter((p) => p.proveedorId === proveedor.id)
          .length,
      }))
      .filter((p) => p.total > 0);

    this.proveedorChartData = {
      labels: proveedorStats.map((p) => p.nombre),
      datasets: [
        {
          label: 'Productos',
          data: proveedorStats.map((p) => p.total),
          backgroundColor: '#4BC0C0',
        },
      ],
    };
  }

  private inicializarChartOptions(): void {
    this.categoriaChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };

    this.stockChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    this.proveedorChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    };
  }

  getCategoryName(categoriaId: string): string {
    const categoria = this.categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }
}
