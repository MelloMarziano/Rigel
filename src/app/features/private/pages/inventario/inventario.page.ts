import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Subscription, combineLatest } from 'rxjs';
import { startWith, debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import {
  Inventario,
  InventarioProducto,
} from 'src/app/core/models/inventario.model';
import { Producto } from 'src/app/core/models/producto.model';
import { Categoria } from 'src/app/core/models/categoria.model';
import { Proveedor } from 'src/app/core/models/proveedor.model';

@Component({
  selector: 'app-inventario-page',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
})
export class InventarioPage implements OnInit, OnDestroy {
  // Estados
  isLoading = false;
  isCreatingInventory = false;
  isSaving = false;

  // Datos
  inventarioActual: Inventario | null = null;
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];

  // Filtros
  fechaSeleccionada = new Date();
  fechaFiltro = new FormControl(new Date().toISOString().split('T')[0]);
  categoriaFiltro = new FormControl('');
  proveedorFiltro = new FormControl('');

  private subscriptions = new Subscription();

  constructor(private firestore: Firestore, private authService: AuthService) {}

  // Helper para convertir fechas de Firebase
  private convertirFecha(fecha: any): Date | undefined {
    if (!fecha) return undefined;

    // Si ya es una Date, devolverla
    if (fecha instanceof Date) return fecha;

    // Si es un Timestamp de Firebase
    if (typeof fecha === 'object' && 'toDate' in fecha) {
      return fecha.toDate();
    }

    // Si es un string, convertir a Date
    if (typeof fecha === 'string') {
      return new Date(fecha);
    }

    return undefined;
  }

  // Helper para limpiar objetos de campos undefined (Firebase no los acepta)
  private limpiarObjetoParaFirebase(obj: any): any {
    const objetoLimpio: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        objetoLimpio[key] = value;
      }
    }

    return objetoLimpio;
  }

  ngOnInit(): void {
    console.log('Inicializando página de inventario...');

    // Verificar que el usuario esté autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('Usuario no autenticado');
      Swal.fire('Error', 'Usuario no autenticado', 'error');
      return;
    }

    console.log('Usuario autenticado:', currentUser.nombre);

    this.cargarDatosIniciales();
    this.setupFiltros();

    // No buscar inventario automáticamente en la carga inicial
    // El usuario puede buscar manualmente cuando esté listo
    console.log('Página de inventario inicializada correctamente');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupFiltros(): void {
    this.subscriptions.add(
      this.fechaFiltro.valueChanges.subscribe((fecha) => {
        if (fecha) {
          try {
            this.fechaSeleccionada = new Date(fecha);
            console.log('Fecha seleccionada:', this.fechaSeleccionada);
          } catch (error) {
            console.error('Error procesando fecha:', error);
            this.fechaSeleccionada = new Date();
          }
        }
      })
    );
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      console.log('Cargando datos iniciales...');

      // Cargar productos
      const productosRef = collection(this.firestore, 'productos');
      this.subscriptions.add(
        collectionData(productosRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.productos = data.filter((p: Producto) => !p.esCombinado);
            console.log('Productos cargados:', this.productos.length);
          },
          error: (error) => {
            console.error('Error cargando productos:', error);
          },
        })
      );

      // Cargar categorías
      const categoriasRef = collection(this.firestore, 'categorias');
      this.subscriptions.add(
        collectionData(categoriasRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.categorias = data;
            console.log('Categorías cargadas:', this.categorias.length);
          },
          error: (error) => {
            console.error('Error cargando categorías:', error);
          },
        })
      );

      // Cargar proveedores
      const proveedoresRef = collection(this.firestore, 'proveedores');
      this.subscriptions.add(
        collectionData(proveedoresRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.proveedores = data;
            console.log('Proveedores cargados:', this.proveedores.length);
          },
          error: (error) => {
            console.error('Error cargando proveedores:', error);
          },
        })
      );
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      Swal.fire('Error', 'Error al cargar los datos iniciales', 'error');
    }
  }

  async buscarInventario(): Promise<void> {
    this.isLoading = true;
    try {
      const fechaStr = this.fechaSeleccionada.toISOString().split('T')[0];
      console.log('Buscando inventario para fecha:', fechaStr);

      const inventariosRef = collection(this.firestore, 'inventarios');
      const q = query(inventariosRef, where('fecha', '==', fechaStr));

      console.log('Ejecutando consulta...');
      const querySnapshot = await getDocs(q);
      console.log('Documentos encontrados:', querySnapshot.size);

      if (!querySnapshot.empty) {
        // Filtrar inventarios no eliminados en el cliente
        const inventariosValidos = querySnapshot.docs.filter((doc) => {
          const data = doc.data();
          return !data['eliminado']; // Solo incluir si no está eliminado
        });

        if (inventariosValidos.length > 0) {
          const inventarioDoc = inventariosValidos[0];
          this.inventarioActual = {
            id: inventarioDoc.id,
            ...inventarioDoc.data(),
          } as Inventario;

          // Convertir fechas usando el helper
          this.inventarioActual.fecha =
            this.convertirFecha(this.inventarioActual.fecha) ||
            this.inventarioActual.fecha;
          this.inventarioActual.fechaActualizacion = this.convertirFecha(
            this.inventarioActual.fechaActualizacion
          );
          this.inventarioActual.fechaCreacion = this.convertirFecha(
            this.inventarioActual.fechaCreacion
          );
        } else {
          this.inventarioActual = null;
        }
      } else {
        this.inventarioActual = null;
      }
    } catch (error) {
      console.error('Error buscando inventario:', error);

      // No mostrar error en la carga inicial
      this.inventarioActual = null;
    } finally {
      this.isLoading = false;
    }
  }

  async crearNuevoInventario(): Promise<void> {
    if (this.inventarioActual) {
      const result = await Swal.fire({
        title: '¿Crear nuevo inventario?',
        text: 'Ya existe un inventario para esta fecha. ¿Deseas reemplazarlo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, crear nuevo',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;
    }

    this.isCreatingInventory = true;
    try {
      // Filtrar productos según los filtros seleccionados
      let productosFiltrados = [...this.productos];

      const categoriaId = this.categoriaFiltro.value;
      const proveedorId = this.proveedorFiltro.value;

      if (categoriaId) {
        productosFiltrados = productosFiltrados.filter(
          (p) => p.categoriaId === categoriaId
        );
      }

      if (proveedorId) {
        productosFiltrados = productosFiltrados.filter(
          (p) => p.proveedorId === proveedorId
        );
      }

      // Crear productos del inventario
      const productosInventario: InventarioProducto[] = productosFiltrados.map(
        (producto) => {
          const categoria = this.categorias.find(
            (c) => c.id === producto.categoriaId
          );
          const proveedor = this.proveedores.find(
            (p) => p.id === producto.proveedorId
          );

          return {
            productoId: producto.id!,
            nombre: producto.nombre,
            categoria: categoria?.nombre || 'Sin categoría',
            proveedor: proveedor?.nombre || 'Sin proveedor',
            stockActual: producto.stock || 0,
            stockContado: producto.stock || 0,
            costoUnitario: producto.costo,
            valorTotal: (producto.stock || 0) * producto.costo,
            unidadMedida: producto.unidadMedida,
            diferencia: 0,
          };
        }
      );

      // Calcular totales
      const inversionTotal = productosInventario.reduce(
        (sum, p) => sum + p.valorTotal,
        0
      );
      const totalProductos = productosInventario.length;
      const totalUnidades = productosInventario.reduce(
        (sum, p) => sum + p.stockContado,
        0
      );
      const costoPromedio =
        totalUnidades > 0 ? inversionTotal / totalUnidades : 0;

      // Crear inventario como borrador
      const inventarioDataRaw = {
        fecha: this.fechaSeleccionada.toISOString().split('T')[0],
        categoriaId: categoriaId || undefined,
        proveedorId: proveedorId || undefined,
        productos: productosInventario,
        inversionTotal,
        totalProductos,
        totalUnidades,
        costoPromedio,
        fechaCreacion: serverTimestamp(),
        usuarioId: this.authService.getCurrentUser()?.id,
        estado: 'borrador',
      };

      // Limpiar campos undefined para Firebase
      const inventarioData = this.limpiarObjetoParaFirebase(inventarioDataRaw);

      // Guardar inmediatamente en Firebase como borrador
      const inventariosRef = collection(this.firestore, 'inventarios');
      const docRef = await addDoc(inventariosRef, inventarioData);

      // Crear objeto local
      this.inventarioActual = {
        id: docRef.id,
        fecha: this.fechaSeleccionada,
        categoriaId: categoriaId || undefined,
        proveedorId: proveedorId || undefined,
        productos: productosInventario,
        inversionTotal,
        totalProductos,
        totalUnidades,
        costoPromedio,
        fechaCreacion: new Date(),
        usuarioId: this.authService.getCurrentUser()?.id,
        estado: 'borrador',
      };

      Swal.fire(
        '¡Creado!',
        'Inventario creado como borrador. Puedes editarlo y luego finalizarlo.',
        'success'
      );
    } catch (error) {
      console.error('Error creando inventario:', error);
      Swal.fire('Error', 'Error al crear el inventario', 'error');
    } finally {
      this.isCreatingInventory = false;
    }
  }

  private recalcularTotales(): void {
    if (!this.inventarioActual) return;

    this.inventarioActual.inversionTotal =
      this.inventarioActual.productos.reduce((sum, p) => sum + p.valorTotal, 0);
    this.inventarioActual.totalUnidades =
      this.inventarioActual.productos.reduce(
        (sum, p) => sum + p.stockContado,
        0
      );
    this.inventarioActual.costoPromedio =
      this.inventarioActual.totalUnidades > 0
        ? this.inventarioActual.inversionTotal /
          this.inventarioActual.totalUnidades
        : 0;
  }

  async guardarInventario(): Promise<void> {
    if (!this.inventarioActual) return;

    // Confirmar finalización si es un borrador
    if (this.inventarioActual.estado === 'borrador') {
      const result = await Swal.fire({
        title: '¿Finalizar inventario?',
        text: 'Una vez finalizado, no podrás editarlo. ¿Estás seguro?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;
    }

    this.isSaving = true;
    try {
      // Crear una copia limpia sin campos undefined
      const inventarioDataRaw = {
        ...this.inventarioActual,
        fecha: this.fechaSeleccionada.toISOString().split('T')[0],
        fechaActualizacion: serverTimestamp(),
        estado: 'finalizado',
      };

      // Limpiar campos undefined para Firebase
      const inventarioData = this.limpiarObjetoParaFirebase(inventarioDataRaw);

      if (this.inventarioActual.id) {
        // Actualizar existente - finalizar borrador
        const inventarioRef = doc(
          this.firestore,
          'inventarios',
          this.inventarioActual.id
        );
        await updateDoc(inventarioRef, inventarioData);

        // Actualizar estado local
        this.inventarioActual.estado = 'finalizado';
        this.inventarioActual.fechaActualizacion = new Date();
      } else {
        // Crear nuevo (caso poco probable)
        const inventariosRef = collection(this.firestore, 'inventarios');
        const docRef = await addDoc(inventariosRef, inventarioData);
        this.inventarioActual.id = docRef.id;
        this.inventarioActual.estado = 'finalizado';
      }

      Swal.fire(
        '¡Finalizado!',
        'Inventario finalizado exitosamente',
        'success'
      );
    } catch (error) {
      console.error('Error finalizando inventario:', error);
      Swal.fire('Error', 'Error al finalizar el inventario', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'text-danger fw-bold';
    if (stock <= 5) return 'text-warning fw-bold';
    return 'text-success fw-bold';
  }

  trackByProducto(index: number, producto: InventarioProducto): string {
    return producto.productoId;
  }

  async cancelarInventario(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar inventario?',
      text: 'Se eliminará el inventario en borrador. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No cancelar',
    });

    if (!result.isConfirmed) return;

    this.isSaving = true;
    try {
      if (this.inventarioActual?.id) {
        // Eliminar el inventario borrador de Firebase
        const inventarioRef = doc(
          this.firestore,
          'inventarios',
          this.inventarioActual.id
        );
        await updateDoc(inventarioRef, {
          eliminado: true,
          fechaEliminacion: serverTimestamp(),
        });
      }

      this.inventarioActual = null;
      Swal.fire('¡Cancelado!', 'El inventario ha sido cancelado', 'success');
    } catch (error) {
      console.error('Error cancelando inventario:', error);
      Swal.fire('Error', 'Error al cancelar el inventario', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  calcularValorTotal(producto: InventarioProducto): void {
    if (this.inventarioActual?.estado === 'finalizado') return;

    producto.diferencia = producto.stockContado - producto.stockActual;
    producto.valorTotal = producto.stockContado * producto.costoUnitario;
    this.recalcularTotales();

    // Auto-guardar cambios en Firebase si es un borrador
    if (this.inventarioActual?.estado === 'borrador') {
      this.autoGuardarBorrador();
    }
  }

  private autoGuardarBorrador(): void {
    // Debounce para evitar demasiadas llamadas
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.guardarBorrador();
    }, 2000); // Guardar después de 2 segundos de inactividad
  }

  private autoSaveTimeout: any;

  private async guardarBorrador(): Promise<void> {
    if (
      !this.inventarioActual?.id ||
      this.inventarioActual.estado !== 'borrador'
    )
      return;

    try {
      const inventarioRef = doc(
        this.firestore,
        'inventarios',
        this.inventarioActual.id
      );
      await updateDoc(inventarioRef, {
        productos: this.inventarioActual.productos,
        inversionTotal: this.inventarioActual.inversionTotal,
        totalUnidades: this.inventarioActual.totalUnidades,
        costoPromedio: this.inventarioActual.costoPromedio,
        fechaActualizacion: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  }
}
