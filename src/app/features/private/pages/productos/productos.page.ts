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
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';
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

  totalProveedores = 0;
  totalStockValue = 0;
  productosBajosEnStock = 0;

  private subscriptions = new Subscription();

  productoForm!: FormGroup;
  productSearch = new FormControl('');
  categoryFilter = new FormControl('all');
  supplierFilter = new FormControl('all');
  modal: any;

  constructor(private fb: FormBuilder, private firestore: Firestore) {}

  ngOnInit(): void {
    this.productoForm = this.fb.group({
      id: [null],
      nombre: ['', {
        validators: [Validators.required],
        asyncValidators: [this.productNameValidator()],
        updateOn: 'blur'
      }],
      descripcion: ['', Validators.required],
      costo: [0, [Validators.required, Validators.min(0)]],
      IVA: [0, [Validators.required, Validators.min(0)]],
      categoriaId: ['', Validators.required],
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
        switchMap(value => {
          if (!value) {
            return of(null);
          }
          const name = value.toLowerCase();
          const currentId = this.productoForm.get('id')?.value;

          const isDuplicate = this.productos.some(
            p => p.nombre.toLowerCase() === name && p.id !== currentId
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
        // Calcular productos con stock bajo
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
    this.productoForm.patchValue(producto);
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
      nombre: '',
      descripcion: '',
      costo: 0,
      precioVenta: 0,
      categoriaId: '',
      proveedorId: null,
      esCombinado: false,
      stock: 0,
      stockMinimo: 0,
      cantidad: 0,
      unidadMedida: '',
    });
  }

  getCategoryName(categoryId: string): string {
    const categoria = this.categorias.find((c) => c.id === categoryId);
    return categoria ? categoria.nombre : '';
  }

  getCategoryBadgeClass(categoryId: string): string {
    // Puedes personalizar los colores según tus categorías
    const categoria = this.categorias.find((c) => c.id === categoryId);
    if (!categoria) return 'bg-secondary';

    // Asignar colores basados en el nombre de la categoría o usar un hash simple
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
    // Calcular precio de venta aplicando el IVA al costo
    const costoConIva = producto.costo * (1 + (producto.IVA || 0) / 100);
    // Puedes agregar un margen adicional aquí si lo necesitas
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
}