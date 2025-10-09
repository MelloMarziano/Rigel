import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MermasService,
  Merma,
} from '../../../../../core/services/mermas.service';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import { Producto } from '../../../../../core/models/producto.model';

interface ReporteMerma {
  producto: Producto;
  merma: Merma;
  cantidadComprada: number;
  perdidaEstimada: number;
  cantidadUtil: number;
  costoTotal: number;
  costoPerdida: number;
}

@Component({
  selector: 'app-reportes-mermas',
  templateUrl: './reportes-mermas.component.html',
  styleUrls: ['./reportes-mermas.component.scss'],
})
export class ReportesMermasComponent implements OnInit, OnDestroy {
  reportes: ReporteMerma[] = [];
  totalPerdida = 0;
  totalCostoPerdida = 0;
  productoMayorMerma: ReporteMerma | null = null;

  private subscriptions = new Subscription();

  constructor(
    private mermasService: MermasService,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cargarReportes(): void {
    const productosRef = collection(this.firestore, 'productos');
    const productos$ = collectionData(productosRef, {
      idField: 'id',
    });
    const mermas$ = this.mermasService.getMermasActivas();

    this.subscriptions.add(
      combineLatest([productos$, mermas$]).subscribe(
        ([productos, mermas]: [any[], Merma[]]) => {
          this.generarReportes(productos, mermas);
        }
      )
    );
  }

  private generarReportes(productos: Producto[], mermas: Merma[]): void {
    this.reportes = [];

    productos.forEach((producto) => {
      const merma = mermas.find((m) => m.productoId === producto.id);
      if (merma && producto.cantidad > 0) {
        const perdidaEstimada = this.mermasService.calcularPerdida(
          producto.cantidad,
          merma.porcentajeMerma
        );
        const cantidadUtil = this.mermasService.calcularCantidadUtil(
          producto.cantidad,
          merma.porcentajeMerma
        );
        const costoTotal = producto.cantidad * (producto.costo || 0);
        const costoPerdida = perdidaEstimada * (producto.costo || 0);

        this.reportes.push({
          producto,
          merma,
          cantidadComprada: producto.cantidad,
          perdidaEstimada,
          cantidadUtil,
          costoTotal,
          costoPerdida,
        });
      }
    });

    this.calcularTotales();
  }

  private calcularTotales(): void {
    this.totalPerdida = this.reportes.reduce(
      (sum, r) => sum + r.perdidaEstimada,
      0
    );
    this.totalCostoPerdida = this.reportes.reduce(
      (sum, r) => sum + r.costoPerdida,
      0
    );

    // Encontrar producto con mayor merma
    if (this.reportes.length > 0) {
      this.productoMayorMerma = this.reportes.reduce((max, r) =>
        r.perdidaEstimada > max.perdidaEstimada ? r : max
      );
    }
  }

  exportarReporte(): void {
    // Implementar exportación a CSV o PDF
    console.log('Exportar reporte', this.reportes);
  }
}
