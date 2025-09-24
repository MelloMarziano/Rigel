import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { Proveedor } from '../../../../core/models/proveedor.model';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  totalProductos = 0;
  productosBajosEnStock = 0;
  totalStockValue = 0;
  totalCategorias = 0;
  totalProveedores = 0;

  private subscriptions = new Subscription();

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarProveedores();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe((data: any) => {
        const productos: Producto[] = data;
        this.totalProductos = productos.length;
        this.productosBajosEnStock = productos.filter(
          (p: Producto) => !p.esCombinado && p.stock !== undefined && p.stockMinimo !== undefined && p.stock <= p.stockMinimo
        ).length;
        this.totalStockValue = productos.reduce((acc: number, p: Producto) => acc + (p.stock || 0) * p.costo, 0);
      })
    );
  }

  private cargarCategorias(): void {
    const categoriasRef = collection(this.firestore, 'categorias');
    this.subscriptions.add(
      collectionData(categoriasRef, { idField: 'id' }).subscribe((data: any) => {
        this.totalCategorias = data.length;
      })
    );
  }

  private cargarProveedores(): void {
    const proveedoresRef = collection(this.firestore, 'proveedores');
    this.subscriptions.add(
      collectionData(proveedoresRef, { idField: 'id' }).subscribe((data: any) => {
        this.totalProveedores = data.length;
      })
    );
  }
}