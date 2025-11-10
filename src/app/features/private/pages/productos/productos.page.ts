import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  AsyncValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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
import { Subscription, combineLatest, Observable, of } from 'rxjs';
import { startWith, debounceTime, switchMap, map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Producto } from '../../../../core/models/producto.model';
import {
  Categoria,
  FamiliaCategoria,
} from '../../../../core/models/categoria.model';
import { Proveedor } from '../../../../core/models/proveedor.model';

declare var bootstrap: any;

@Component({
  selector: 'app-productos-page',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
})
export class ProductosPage implements OnInit, OnDestroy {
  productos: Producto[] = [];
  filteredProducts: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];
  unidadesDisponibles: string[] = [];
  familiasDisponibles: FamiliaCategoria[] = [];

  totalProveedores = 0;
  totalStockValue = 0;
  productosBajosEnStock = 0;

  private subscriptions = new Subscription();

  productoForm!: FormGroup;
  productSearch = new FormControl('');
  categoryFilter = new FormControl('all');
  supplierFilter = new FormControl('all');
  modal: any;
  detalleModal: any;
  productoSeleccionado: Producto | null = null;

  constructor(private fb: FormBuilder, private firestore: Firestore) {}

  ngOnInit(): void {
    this.productoForm = this.fb.group({
      id: [''],
      nombre: [
        '',
        {
          validators: [Validators.required],
          asyncValidators: [this.productNameValidator()],
          updateOn: 'blur',
        },
      ],
      descripcion: ['', Validators.required],
      costo: [0, [Validators.required, Validators.min(0)]],
      IVA: [0, [Validators.required, Validators.min(0)]],
      categoriaId: ['', Validators.required],
      familiaId: ['', Validators.required],
      proveedorId: [null],
      esCombinado: [false],
      stock: [0, Validators.min(0)],
      stockMinimo: [0, Validators.min(0)],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      unidadMedida: ['', Validators.required],
    });

    this.cargarProductos();
    this.cargarCategorias();
    this.cargarProveedores();

    const modalEl = document.getElementById('productModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }

    const detalleModalEl = document.getElementById('detalleProductoModal');
    if (detalleModalEl) {
      this.detalleModal = new bootstrap.Modal(detalleModalEl);
    }

    this.subscriptions.add(
      this.productoForm
        .get('categoriaId')
        ?.valueChanges.subscribe((categoriaId) => {
          this.onCategoriaChange(categoriaId);
        })
    );

    this.subscriptions.add(
      this.productoForm
        .get('esCombinado')
        ?.valueChanges.subscribe((esCombinado) => {
          this.onEsCombinadoChange(esCombinado);
        })
    );

    this.subscriptions.add(
      combineLatest([
        this.productSearch.valueChanges.pipe(startWith('')),
        this.categoryFilter.valueChanges.pipe(startWith('all')),
        this.supplierFilter.valueChanges.pipe(startWith('all')),
      ])
        .pipe(debounceTime(300))
        .subscribe(([searchTerm, categoryId, supplierId]) => {
          this.filterProducts(
            searchTerm || '',
            categoryId || 'all',
            supplierId || 'all'
          );
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  productNameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return of(control.value).pipe(
        debounceTime(500),
        switchMap((value) => {
          if (!value || !value.trim()) {
            return of(null);
          }

          const name = value.trim().toLowerCase();
          const currentId = this.productoForm?.get('id')?.value;

          if (!this.productos || this.productos.length === 0) {
            return of(null);
          }

          const isDuplicate = this.productos.some(
            (p) => p.nombre.toLowerCase() === name && p.id !== currentId
          );

          if (isDuplicate) {
            return of({ productNameExists: true });
          } else {
            return of(null);
          }
        })
      );
    };
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe((data: any) => {
        this.productos = data;
        this.filteredProducts = data;
        this.totalStockValue = data.reduce(
          (acc: number, p: Producto) => acc + (p.stock || 0) * p.costo,
          0
        );
        this.productosBajosEnStock = data.filter(
          (p: Producto) =>
            !p.esCombinado && (p.stock || 0) <= (p.stockMinimo || 0)
        ).length;
      })
    );
  }

  private cargarCategorias(): void {
    const categoriasRef = collection(this.firestore, 'categorias');
    this.subscriptions.add(
      collectionData(categoriasRef, { idField: 'id' }).subscribe(
        (data: any) => {
          this.categorias = data;
        }
      )
    );
  }

  private cargarProveedores(): void {
    const proveedoresRef = collection(this.firestore, 'proveedores');
    this.subscriptions.add(
      collectionData(proveedoresRef, { idField: 'id' }).subscribe(
        (data: any) => {
          this.proveedores = data;
          this.totalProveedores = data.length;
        }
      )
    );
  }

  private filterProducts(
    searchTerm: string,
    categoryId: string,
    supplierId: string
  ): void {
    let filtered = [...this.productos];

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter((p) => p.categoriaId === categoryId);
    }

    if (supplierId && supplierId !== 'all') {
      filtered = filtered.filter((p) => p.proveedorId === supplierId);
    }

    this.filteredProducts = filtered;
  }

  onCategoriaChange(categoriaId: string): void {
    const categoria = this.categorias.find((c) => c.id === categoriaId);

    this.unidadesDisponibles = categoria?.unidadesDisponibles || [];
    if (this.unidadesDisponibles.length > 0) {
      this.productoForm
        .get('unidadMedida')
        ?.setValue(this.unidadesDisponibles[0]);
    } else {
      this.productoForm.get('unidadMedida')?.setValue('');
    }

    this.familiasDisponibles = categoria?.familias || [];
    this.productoForm.get('familiaId')?.setValue('');
  }

  onEsCombinadoChange(esCombinado: boolean): void {
    const stockControl = this.productoForm.get('stock');
    const stockMinimoControl = this.productoForm.get('stockMinimo');
    if (esCombinado) {
      stockControl?.setValue(null);
      stockControl?.disable();
      stockMinimoControl?.setValue(null);
      stockMinimoControl?.disable();
    } else {
      stockControl?.enable();
      stockMinimoControl?.enable();
    }
  }
  async guardarProducto() {
    if (this.productoForm.invalid) {
      Swal.fire(
        'Error',
        'Por favor, complete todos los campos requeridos.',
        'error'
      );
      return;
    }

    const formValue = this.productoForm.getRawValue();

    Swal.showLoading();

    try {
      if (formValue.id) {
        const productoRef = doc(this.firestore, 'productos', formValue.id);
        await updateDoc(productoRef, formValue);
        Swal.fire(
          '¡Actualizado!',
          'El producto ha sido actualizado.',
          'success'
        );
      } else {
        formValue.fechaCreacion = serverTimestamp();
        delete formValue.id;
        await addDoc(collection(this.firestore, 'productos'), formValue);
        Swal.fire('¡Creado!', 'El nuevo producto ha sido guardado.', 'success');
      }
      this.modal.hide();
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el producto.', 'error');
    }
  }

  editarProducto(producto: Producto) {
    if (!this.productoForm.contains('id')) {
      this.productoForm.addControl('id', this.fb.control(''));
    }

    const categoria = this.categorias.find(
      (c) => c.id === producto.categoriaId
    );
    this.unidadesDisponibles = categoria?.unidadesDisponibles || [];
    this.familiasDisponibles = categoria?.familias || [];

    this.productoForm.patchValue({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      costo: producto.costo,
      IVA: producto.IVA,
      categoriaId: producto.categoriaId,
      familiaId: producto.familiaId,
      proveedorId: producto.proveedorId,
      esCombinado: producto.esCombinado,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      cantidad: producto.cantidad,
      unidadMedida: producto.unidadMedida,
    });

    this.modal.show();
  }

  async eliminarProducto(productoId: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
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
        await deleteDoc(doc(this.firestore, 'productos', productoId));
        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
        Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
      }
    }
  }

  abrirModalNuevo() {
    this.resetForm();
    this.modal.show();
  }

  resetForm() {
    this.productoForm.reset({
      id: '',
      nombre: '',
      descripcion: '',
      costo: 0,
      IVA: 0,
      categoriaId: '',
      familiaId: '',
      proveedorId: null,
      esCombinado: false,
      stock: 0,
      stockMinimo: 0,
      cantidad: 0,
      unidadMedida: '',
    });
    this.familiasDisponibles = [];
    this.unidadesDisponibles = [];
  }

  getCategoryName(categoryId: string): string {
    const categoria = this.categorias.find((c) => c.id === categoryId);
    return categoria ? categoria.nombre : '';
  }

  getFamiliaName(categoriaId: string, familiaId: string | undefined): string {
    if (!familiaId) return '';
    const categoria = this.categorias.find((c) => c.id === categoriaId);
    if (!categoria || !categoria.familias) return '';

    const familia = categoria.familias.find((f) => f.id === familiaId);
    return familia ? familia.nombre : '';
  }

  getCategoryBadgeClass(categoryId: string): string {
    const categoria = this.categorias.find((c) => c.id === categoryId);
    if (!categoria) return 'bg-secondary';

    const colors = [
      'bg-primary',
      'bg-success',
      'bg-info',
      'bg-warning',
      'bg-danger',
    ];
    const index = categoria.nombre.length % colors.length;
    return colors[index];
  }

  getPrecioVenta(producto: Producto): number {
    const costoConIva = producto.costo * (1 + (producto.IVA || 0) / 100);
    return costoConIva;
  }

  getStockClass(producto: Producto): string {
    if (producto.esCombinado) return 'text-muted';

    const stock = producto.stock || 0;
    const stockMinimo = producto.stockMinimo || 0;

    if (stock <= 0) return 'text-danger';
    if (stock <= stockMinimo) return 'text-warning';
    return 'text-success';
  }

  getUnidadDisplay(producto: Producto): string {
    if (producto.cantidad && producto.unidadMedida) {
      return `${producto.unidadMedida}`;
    }
    return 'unidades';
  }

  getMargenPorcentaje(producto: Producto): string {
    const precioVenta = this.getPrecioVenta(producto);
    const costo = producto.costo;

    if (costo === 0) return '0.0';

    const margen = ((precioVenta - costo) / costo) * 100;
    return margen.toFixed(1);
  }

  verDetalleProducto(producto: Producto) {
    this.productoSeleccionado = producto;
    this.detalleModal.show();
  }

  editarDesdeDetalle() {
    if (this.productoSeleccionado) {
      this.detalleModal.hide();
      this.editarProducto(this.productoSeleccionado);
    }
  }

  async eliminarDesdeDetalle() {
    if (this.productoSeleccionado) {
      this.detalleModal.hide();
      await this.eliminarProducto(this.productoSeleccionado.id);
      this.productoSeleccionado = null;
    }
  }

  getProveedorName(proveedorId: string | null | undefined): string {
    if (!proveedorId) return 'Sin proveedor';
    const proveedor = this.proveedores.find((p) => p.id === proveedorId);
    return proveedor ? proveedor.nombre : 'Sin proveedor';
  }
  exportarPDF(): void {
    if (this.filteredProducts.length === 0) {
      Swal.fire('Sin datos', 'No hay productos para exportar.', 'info');
      return;
    }

    Swal.fire({
      title: 'Generando PDF...',
      text: 'Por favor espera mientras se genera el documento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Ordenar productos alfabéticamente y por categoría/familia
    const productosOrdenados = [...this.filteredProducts].sort((a, b) => {
      const categoriaA = this.getCategoryName(a.categoriaId);
      const categoriaB = this.getCategoryName(b.categoriaId);

      if (categoriaA !== categoriaB) {
        return categoriaA.localeCompare(categoriaB);
      }

      const familiaA = this.getFamiliaName(a.categoriaId, a.familiaId);
      const familiaB = this.getFamiliaName(b.categoriaId, b.familiaId);

      if (familiaA !== familiaB) {
        return familiaA.localeCompare(familiaB);
      }

      return a.nombre.localeCompare(b.nombre);
    });

    // Agrupar por categoría y familia
    const productosAgrupados = this.agruparProductos(productosOrdenados);

    // Crear el PDF
    setTimeout(() => {
      this.generarPDFConJsPDF(productosAgrupados);
      Swal.close();
    }, 500);
  }

  private agruparProductos(productos: Producto[]): any {
    const grupos: any = {};

    productos.forEach((producto) => {
      const categoria = this.getCategoryName(producto.categoriaId);
      const familia =
        this.getFamiliaName(producto.categoriaId, producto.familiaId) ||
        'Sin familia';

      if (!grupos[categoria]) {
        grupos[categoria] = {};
      }

      if (!grupos[categoria][familia]) {
        grupos[categoria][familia] = [];
      }

      grupos[categoria][familia].push(producto);
    });

    return grupos;
  }

  private generarPDFConJsPDF(productosAgrupados: any): void {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Configurar encabezado
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Listado de Productos', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el ${fechaActual}`, 105, 30, { align: 'center' });
    doc.text(`Total de productos: ${this.filteredProducts.length}`, 105, 36, {
      align: 'center',
    });

    let yPosition = 50;

    // Generar contenido por categorías y familias
    Object.keys(productosAgrupados).forEach((categoria) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Título de categoría
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.setFillColor(220, 53, 69);
      doc.rect(20, yPosition - 5, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(categoria, 25, yPosition, { baseline: 'middle' });
      yPosition += 15;

      Object.keys(productosAgrupados[categoria]).forEach((familia) => {
        const productos = productosAgrupados[categoria][familia];

        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        // Título de familia
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition - 3, 170, 6, 'F');
        doc.setTextColor(51, 51, 51);
        doc.text(`${familia} (${productos.length} productos)`, 25, yPosition);
        yPosition += 10;

        // Preparar datos para la tabla
        const tableData = productos.map((producto: Producto) => {
          const precioVenta = this.getPrecioVenta(producto);
          return [
            producto.nombre,
            producto.descripcion || '-',
            `${producto.cantidad} ${producto.unidadMedida}`,
            `${producto.costo.toFixed(2)}€`,
            `${producto.IVA}%`,
            `${precioVenta.toFixed(2)}€`,
            producto.esCombinado ? 'Receta' : (producto.stock || 0).toString(),
            producto.esCombinado ? '-' : (producto.stockMinimo || 0).toString(),
            this.getProveedorName(producto.proveedorId),
          ];
        });

        // Generar tabla
        autoTable(doc, {
          head: [
            [
              'Producto',
              'Descripción',
              'Contenido',
              'Costo',
              'IVA',
              'Precio + IVA',
              'Stock',
              'Stock Mín.',
              'Proveedor',
            ],
          ],
          body: tableData,
          startY: yPosition,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [248, 249, 250],
            textColor: [40, 40, 40],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 249, 249],
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 18 },
            3: { cellWidth: 15 },
            4: { cellWidth: 10 },
            5: { cellWidth: 18 },
            6: { cellWidth: 12 },
            7: { cellWidth: 12 },
            8: { cellWidth: 25 },
          },
          margin: { left: 20, right: 20 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      });

      yPosition += 5;
    });

    // Agregar resumen
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    const totalValorStock = this.filteredProducts
      .filter((p) => !p.esCombinado)
      .reduce((acc, p) => acc + (p.stock || 0) * p.costo, 0);

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Resumen', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(
      `Total de productos: ${this.filteredProducts.length}`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Productos con stock bajo: ${this.productosBajosEnStock}`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Valor total en stock: ${totalValorStock.toFixed(2)}€`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Categorías: ${Object.keys(productosAgrupados).length}`,
      20,
      yPosition
    );

    // Descargar el PDF
    const nombreArchivo = `productos_${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    doc.save(nombreArchivo);

    Swal.fire({
      title: '¡PDF Generado!',
      text: `El archivo ${nombreArchivo} se ha descargado correctamente.`,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false,
    });
  }
}
