import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
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
import { Subscription, combineLatest } from 'rxjs';
import { startWith, debounceTime } from 'rxjs/operators';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';

declare var bootstrap: any;

@Component({
  selector: 'app-proveedores-page',
  templateUrl: './proveedores.page.html',
  styleUrls: ['./proveedores.page.scss'],
})
export class ProveedoresPage implements OnInit, OnDestroy {
  proveedores: Proveedor[] = [];
  filteredProveedores: Proveedor[] = [];
  productos: Producto[] = [];
  categorias: Categoria[] = [];

  totalProductos = 0;
  productosBajosEnStock = 0;

  private subscriptions = new Subscription();

  proveedorForm: FormGroup;
  productSearch = new FormControl('');
  proveedorSearch = new FormControl('');
  categoryFilter = new FormControl('all');
  modal: any;
  detalleModal: any;
  proveedorSeleccionado: Proveedor | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef
  ) {
    this.proveedorForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      cif: ['', Validators.required],
      razonSocial: ['', Validators.required],
      contacto: this.fb.group({
        nombre: ['', Validators.required],
        telefono: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
      }),
      direccion: this.fb.group({
        calle: ['', Validators.required],
        codigoPostal: ['', Validators.required],
        ciudad: ['', Validators.required],
        provincia: ['', Validators.required],
      }),
      iban: [''],
      plazoPago: [30, Validators.min(0)],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      activo: [true],
      metodoPago: ['', Validators.required],
      productos: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarProductos();
    this.cargarCategorias();
    const modalEl = document.getElementById('staticBackdrop');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }

    const detalleModalEl = document.getElementById('detalleModal');
    if (detalleModalEl) {
      this.detalleModal = new bootstrap.Modal(detalleModalEl);
    }

    this.subscriptions.add(
      this.productSearch.valueChanges.subscribe(() => {
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      combineLatest([
        this.proveedorSearch.valueChanges.pipe(startWith('')),
        this.categoryFilter.valueChanges.pipe(startWith('all')),
      ])
        .pipe(debounceTime(300))
        .subscribe(([searchTerm, categoryId]) => {
          this.filterProveedores(searchTerm || '', categoryId || 'all');
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get productosFormArray() {
    return this.proveedorForm.get('productos') as FormArray;
  }

  private cargarProveedores(): void {
    const proveedoresRef = collection(this.firestore, 'proveedores');
    this.subscriptions.add(
      collectionData(proveedoresRef, { idField: 'id' }).subscribe(
        (data: any) => {
          this.proveedores = data;
          this.filteredProveedores = data;
        }
      )
    );
  }

  private cargarProductos(): void {
    const productosRef = collection(this.firestore, 'productos');
    this.subscriptions.add(
      collectionData(productosRef, { idField: 'id' }).subscribe((data: any) => {
        this.productos = data;
        this.totalProductos = data.length;
        this.productosBajosEnStock = data.filter(
          (p: Producto) =>
            !p.esCombinado &&
            p.stock !== undefined &&
            p.stockMinimo !== undefined &&
            p.stock <= p.stockMinimo
        ).length;
        this.buildProductsFormArray();
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

  private filterProveedores(searchTerm: string, categoryId: string): void {
    let filtered = [...this.proveedores];

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryId && categoryId !== 'all') {
      const productIdsInCategory = this.productos
        .filter((p) => p.categoriaId === categoryId)
        .map((p) => p.id);

      filtered = filtered.filter((proveedor) =>
        proveedor.productos.some((pId) => productIdsInCategory.includes(pId))
      );
    }

    this.filteredProveedores = filtered;
  }

  private buildProductsFormArray() {
    this.productosFormArray.clear();
    this.productos.forEach(() => {
      this.productosFormArray.push(new FormControl(false));
    });
  }

  shouldShowProduct(index: number): boolean {
    const searchTerm = this.productSearch.value?.toLowerCase() || '';
    if (!searchTerm) {
      return true;
    }
    return this.productos[index].nombre.toLowerCase().includes(searchTerm);
  }

  async guardarProveedor() {
    if (this.proveedorForm.invalid) {
      Swal.fire(
        'Error',
        'Por favor, complete todos los campos requeridos.',
        'error'
      );
      return;
    }

    const formValue = this.proveedorForm.value;
    const selectedProductIds = this.productos
      .filter((_, i) => this.productosFormArray.at(i).value)
      .map((p) => p.id);

    const proveedorData = {
      ...formValue,
      productos: selectedProductIds,
    };

    Swal.showLoading();

    try {
      if (formValue.id) {
        const proveedorRef = doc(this.firestore, 'proveedores', formValue.id);
        await updateDoc(proveedorRef, proveedorData);
        Swal.fire(
          '¡Actualizado!',
          'El proveedor ha sido actualizado.',
          'success'
        );
      } else {
        proveedorData.fechaCreacion = serverTimestamp();
        delete proveedorData.id;
        await addDoc(collection(this.firestore, 'proveedores'), proveedorData);
        Swal.fire(
          '¡Creado!',
          'El nuevo proveedor ha sido guardado.',
          'success'
        );
      }
      this.modal.hide();
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar el proveedor:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el proveedor.', 'error');
    }
  }

  editarProveedor(proveedor: Proveedor) {
    this.proveedorForm.reset();
    this.proveedorForm.patchValue(proveedor);

    this.productosFormArray.controls.forEach((control, i) => {
      if (
        proveedor.productos &&
        this.productos[i] &&
        proveedor.productos.includes(this.productos[i].id)
      ) {
        control.setValue(true);
      } else {
        control.setValue(false);
      }
    });

    this.modal.show();
  }

  async eliminarProveedor(proveedorId: string) {
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
        await deleteDoc(doc(this.firestore, 'proveedores', proveedorId));
        Swal.fire('¡Eliminado!', 'El proveedor ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error al eliminar el proveedor:', error);
        Swal.fire('Error', 'No se pudo eliminar el proveedor.', 'error');
      }
    }
  }

  abrirModalNuevo() {
    this.resetForm();
    this.modal.show();
  }

  resetForm() {
    this.proveedorForm.reset({
      nombre: '',
      cif: '',
      razonSocial: '',
      contacto: { nombre: '', telefono: '', email: '' },
      direccion: { calle: '', codigoPostal: '', ciudad: '', provincia: '' },
      iban: '',
      plazoPago: 30,
      descuento: 0,
      activo: true,
      metodoPago: '',
    });
    if (this.productosFormArray) {
      this.productosFormArray.controls.forEach((control) =>
        control.setValue(false)
      );
    }
    this.productSearch.setValue('');
  }

  getProductName(productId: string): string {
    const producto = this.productos.find((p) => p.id === productId);
    return producto ? producto.nombre : '';
  }

  verDetalleProveedor(proveedor: Proveedor) {
    // Buscar productos que pertenecen a este proveedor
    // Puede ser que estén en proveedor.productos O que el producto tenga proveedorId
    const productosDelProveedor = this.productos
      .filter(
        (p) =>
          (proveedor.productos && proveedor.productos.includes(p.id)) ||
          p.proveedorId === proveedor.id
      )
      .map((p) => p.id);

    // Crear una copia del proveedor con los productos actualizados
    this.proveedorSeleccionado = {
      ...proveedor,
      productos: productosDelProveedor,
    };

    this.detalleModal.show();
  }

  editarDesdeDetalle() {
    if (this.proveedorSeleccionado) {
      this.detalleModal.hide();
      this.editarProveedor(this.proveedorSeleccionado);
    }
  }

  async eliminarDesdeDetalle() {
    if (this.proveedorSeleccionado) {
      this.detalleModal.hide();
      await this.eliminarProveedor(this.proveedorSeleccionado.id);
      this.proveedorSeleccionado = null;
    }
  }
}
