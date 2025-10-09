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
  deleteDoc,
  doc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import {
  Inventario,
  InventarioProducto,
} from 'src/app/core/models/inventario.model';
import { Producto } from 'src/app/core/models/producto.model';
import {
  Categoria,
  FamiliaCategoria,
} from 'src/app/core/models/categoria.model';
import { Proveedor } from 'src/app/core/models/proveedor.model';

declare var bootstrap: any;

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

  // Modal de nuevo inventario
  categoriaSeleccionada: string = '';
  modal: any;

  // Filtros por familias
  familiasDisponibles: any[] = [];
  familiaSeleccionada = '';
  productosFiltrados: InventarioProducto[] = [];

  // Búsqueda de productos
  busquedaProducto = '';
  productosSinFiltrar: InventarioProducto[] = [];

  // Propiedades para el historial
  historialInventarios: Inventario[] = [];
  historialFiltrado: Inventario[] = [];
  historialFiltroCategoria = '';
  historialFiltroEstado = '';
  historialLimite = '25';
  isLoadingHistorial = false;
  modalHistorial: any;

  // Propiedades para agregar productos
  productosDisponiblesParaAgregar: Producto[] = [];
  productosSeleccionadosParaAgregar = new Set<string>();
  busquedaProductosNuevos = '';
  isLoadingProductosNuevos = false;
  isAgregarProductos = false;
  modalAgregarProductos: any;

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
        // Si es un array, limpiar cada elemento
        if (Array.isArray(value)) {
          objetoLimpio[key] = value.map((item) =>
            typeof item === 'object'
              ? this.limpiarObjetoParaFirebase(item)
              : item
          );
        }
        // Si es un objeto, limpiar recursivamente
        else if (typeof value === 'object' && value !== null) {
          objetoLimpio[key] = this.limpiarObjetoParaFirebase(value);
        }
        // Si es un valor primitivo, agregarlo directamente
        else {
          objetoLimpio[key] = value;
        }
      }
    }

    return objetoLimpio;
  }

  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      Swal.fire('Error', 'Usuario no autenticado', 'error');
      return;
    }

    this.cargarDatosIniciales();
    this.setupFiltros();

    // Buscar automáticamente inventarios existentes para la fecha actual
    this.buscarInventario();
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
          } catch (error) {
            this.fechaSeleccionada = new Date();
          }
        }
      })
    );
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      // Cargar productos
      const productosRef = collection(this.firestore, 'productos');
      this.subscriptions.add(
        collectionData(productosRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.productos = data.filter((p: Producto) => !p.esCombinado);
          },
          error: (error) => {
            Swal.fire('Error', 'Error al cargar productos', 'error');
          },
        })
      );

      // Cargar categorías
      const categoriasRef = collection(this.firestore, 'categorias');
      this.subscriptions.add(
        collectionData(categoriasRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.categorias = data;
            // Reconfigurar familias si hay un inventario cargado
            if (this.inventarioActual) {
              this.configurarFamiliasDisponibles();
              this.aplicarFiltroFamilia();
            }
          },
          error: (error) => {
            Swal.fire('Error', 'Error al cargar categorías', 'error');
          },
        })
      );

      // Cargar proveedores
      const proveedoresRef = collection(this.firestore, 'proveedores');
      this.subscriptions.add(
        collectionData(proveedoresRef, { idField: 'id' }).subscribe({
          next: (data: any) => {
            this.proveedores = data;
          },
          error: (error) => {
            Swal.fire('Error', 'Error al cargar proveedores', 'error');
          },
        })
      );
    } catch (error) {
      Swal.fire('Error', 'Error al cargar los datos iniciales', 'error');
    }
  }

  async buscarInventario(): Promise<void> {
    this.isLoading = true;
    try {
      const fechaStr = this.fechaSeleccionada.toISOString().split('T')[0];

      const inventariosRef = collection(this.firestore, 'inventarios');
      const q = query(inventariosRef, where('fecha', '==', fechaStr));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Filtrar inventarios no eliminados en el cliente
        const inventariosValidos = querySnapshot.docs.filter((doc) => {
          const data = doc.data();
          return !data['eliminado']; // Solo incluir si no está eliminado
        });

        if (inventariosValidos.length > 0) {
          // Priorizar inventarios en borrador sobre finalizados
          const inventariosBorrador = inventariosValidos.filter((doc) => {
            const data = doc.data();
            return data['estado'] === 'borrador';
          });

          const inventarioDoc =
            inventariosBorrador.length > 0
              ? inventariosBorrador[0]
              : inventariosValidos[0];

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

          // Mostrar mensaje si se cargó un borrador (se mostrará cuando las categorías estén cargadas)
          if (this.inventarioActual.estado === 'borrador') {
            // Usar setTimeout para asegurar que las categorías estén cargadas
            setTimeout(() => {
              const categoria = this.categorias.find(
                (c) => c.id === this.inventarioActual?.categoriaId
              );
              const nombreCategoria = categoria?.nombre || 'Sin categoría';

              Swal.fire({
                title: 'Inventario en borrador encontrado',
                text: `Se ha cargado un inventario en borrador de ${nombreCategoria} para esta fecha. Puedes continuar editándolo.`,
                icon: 'info',
                confirmButtonText: 'Continuar',
                timer: 3000,
                timerProgressBar: true,
              });
            }, 1000);
          }
        } else {
          this.inventarioActual = null;
        }
      } else {
        this.inventarioActual = null;
      }

      // Configurar familias si hay inventario
      if (this.inventarioActual) {
        this.configurarFamiliasDisponibles();
        this.aplicarFiltroFamilia();
      }
    } catch (error) {
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
            stockContado: null, // Inicializar como null para usar placeholder
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
        (sum, p) => sum + (p.stockContado ?? 0),
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

      // Obtener nombre de la categoría si está filtrada
      const categoriaSeleccionada = categoriaId
        ? this.categorias.find((c) => c.id === categoriaId)
        : null;
      const nombreCategoria = categoriaSeleccionada
        ? categoriaSeleccionada.nombre
        : 'General';

      Swal.fire(
        '¡Creado!',
        `Inventario creado con ${totalProductos} productos. Puedes editarlo y luego finalizarlo.`,
        'success'
      );
    } catch (error) {
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
        (sum, p) => sum + (p.stockContado ?? 0),
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
        html: `
          <p>Una vez finalizado, no podrás editarlo.</p>
          <div class="alert alert-warning mt-3">
            <strong>Nota:</strong> Los stocks de los productos NO se actualizarán automáticamente.
            Usa el botón "Actualizar Productos" cuando estés listo.
          </div>
          <p>¿Estás seguro?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, finalizar inventario',
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

      Swal.fire({
        title: '¡Inventario Finalizado!',
        html: `
          <p>El inventario ha sido finalizado exitosamente.</p>
          <div class="alert alert-info mt-3">
            <strong>Recuerda:</strong> Usa el botón "Actualizar Productos" para aplicar los cambios de stock.
          </div>
        `,
        icon: 'success',
        timer: 4000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error al finalizar inventario:', error);
      Swal.fire('Error', 'Error al finalizar el inventario', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async actualizarProductosInventario(): Promise<void> {
    if (!this.inventarioActual) return;

    const productosParaActualizar = this.inventarioActual.productos.filter(
      (producto) =>
        producto.stockContado !== null && producto.stockContado !== undefined
    );

    if (productosParaActualizar.length === 0) {
      Swal.fire(
        'Información',
        'No hay productos con stock contado para actualizar',
        'info'
      );
      return;
    }

    const result = await Swal.fire({
      title: '¿Actualizar stocks de productos?',
      html: `
        <p>Se actualizarán los stocks de <strong>${productosParaActualizar.length} productos</strong> con los valores contados en el inventario.</p>
        <div class="alert alert-warning mt-3">
          <strong>¡Atención!</strong> Esta acción modificará permanentemente los stocks en tu inventario de productos.
        </div>
        <p>¿Estás seguro de continuar?</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, actualizar stocks',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.isSaving = true;
    try {
      await this.actualizarStocksProductos();

      Swal.fire({
        title: '¡Productos Actualizados!',
        html: `
          <p>Los stocks han sido actualizados exitosamente.</p>
          <div class="alert alert-success mt-3">
            <strong>${productosParaActualizar.length} productos</strong> han sido actualizados con el nuevo stock.
          </div>
        `,
        icon: 'success',
        timer: 4000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error al actualizar productos:', error);
      Swal.fire(
        'Error',
        'Error al actualizar los stocks de productos',
        'error'
      );
    } finally {
      this.isSaving = false;
    }
  }

  private async actualizarStocksProductos(): Promise<void> {
    if (!this.inventarioActual) return;

    const productosParaActualizar = this.inventarioActual.productos.filter(
      (producto) =>
        producto.stockContado !== null && producto.stockContado !== undefined
    );

    if (productosParaActualizar.length === 0) {
      console.log('No hay productos con stock contado para actualizar');
      return;
    }

    console.log(
      `Actualizando stock de ${productosParaActualizar.length} productos...`
    );

    // Actualizar productos en lotes para mejor rendimiento
    const promesasActualizacion = productosParaActualizar.map(
      async (productoInventario) => {
        try {
          const productoRef = doc(
            this.firestore,
            'productos',
            productoInventario.productoId
          );

          await updateDoc(productoRef, {
            stock: productoInventario.stockContado,
            fechaActualizacion: serverTimestamp(),
            ultimoInventario: this.fechaSeleccionada
              .toISOString()
              .split('T')[0],
          });

          // Actualizar también en el array local para reflejar los cambios inmediatamente
          const productoLocal = this.productos.find(
            (p) => p.id === productoInventario.productoId
          );
          if (productoLocal) {
            productoLocal.stock = productoInventario.stockContado!;
          }

          console.log(
            `Stock actualizado para ${productoInventario.nombre}: ${productoInventario.stockContado}`
          );
        } catch (error) {
          console.error(
            `Error actualizando producto ${productoInventario.nombre}:`,
            error
          );
          throw error; // Re-lanzar para que se capture en el catch principal
        }
      }
    );

    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(promesasActualizacion);

    console.log('Todos los stocks han sido actualizados exitosamente');
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'text-danger fw-bold';
    if (stock <= 5) return 'text-warning fw-bold';
    return 'text-success fw-bold';
  }

  trackByProducto(_: number, producto: InventarioProducto): string {
    return producto.productoId;
  }

  async cancelarInventario(): Promise<void> {
    if (!this.inventarioActual?.id) {
      Swal.fire('Error', 'No hay inventario para cancelar', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Cancelar inventario?',
      text: 'Se eliminará completamente el inventario en borrador. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No cancelar',
    });

    if (!result.isConfirmed) return;

    this.isSaving = true;
    try {
      // Eliminar completamente el documento de Firebase
      const inventarioRef = doc(
        this.firestore,
        'inventarios',
        this.inventarioActual.id
      );

      await deleteDoc(inventarioRef);

      // Limpiar estado local
      this.inventarioActual = null;
      this.familiasDisponibles = [];
      this.familiaSeleccionada = '';
      this.productosFiltrados = [];

      Swal.fire({
        title: '¡Eliminado!',
        text: 'El inventario ha sido eliminado completamente',
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      Swal.fire('Error', 'Error al eliminar el inventario', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  calcularValorTotal(producto: InventarioProducto): void {
    if (this.inventarioActual?.estado === 'finalizado') return;

    // Si stockContado es null o undefined, usar 0 para los cálculos
    const stockContado = producto.stockContado ?? 0;
    producto.diferencia = stockContado - producto.stockActual;
    producto.valorTotal = stockContado * producto.costoUnitario;
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
      // Error silencioso en auto-guardado
    }
  }

  // Métodos para el modal de nuevo inventario
  abrirModalNuevoInventario(): void {
    this.categoriaSeleccionada = '';

    const modalEl = document.getElementById('modalNuevoInventario');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
      this.modal.show();
    }
  }

  cerrarModalNuevoInventario(): void {
    if (this.modal) {
      this.modal.hide();
    }
    this.categoriaSeleccionada = '';
  }

  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada = categoriaId;
  }

  getNombreCategoriaSeleccionada(): string {
    const categoria = this.categorias.find(
      (c) => c.id === this.categoriaSeleccionada
    );
    return categoria?.nombre || '';
  }

  getTotalProductosCategoria(categoriaId?: string): number {
    const idCategoria = categoriaId || this.categoriaSeleccionada;
    if (!idCategoria) return 0;
    return this.productos.filter(
      (p) => p.categoriaId === idCategoria && !p.esCombinado
    ).length;
  }

  getFamiliasCategoria(): FamiliaCategoria[] {
    const categoria = this.categorias.find(
      (c) => c.id === this.categoriaSeleccionada
    );
    return categoria?.familias || [];
  }

  getProductosPorFamiliaEnCategoria(familiaId: string): Producto[] {
    return this.productos.filter(
      (p) =>
        p.categoriaId === this.categoriaSeleccionada &&
        p.familiaId === familiaId &&
        !p.esCombinado
    );
  }

  getFamiliasNombres(familias: FamiliaCategoria[]): string {
    if (!familias || familias.length === 0) return '';
    return familias.map((f) => f.nombre).join(', ');
  }

  async crearInventarioConSeleccion(): Promise<void> {
    if (!this.categoriaSeleccionada) {
      Swal.fire(
        'Error',
        'Selecciona una categoría para el inventario',
        'error'
      );
      return;
    }

    // Verificar que tengamos datos cargados
    if (this.productos.length === 0) {
      Swal.fire(
        'Error',
        'No se han cargado los productos. Intenta recargar la página.',
        'error'
      );
      return;
    }

    if (this.categorias.length === 0) {
      Swal.fire(
        'Error',
        'No se han cargado las categorías. Intenta recargar la página.',
        'error'
      );
      return;
    }

    if (this.inventarioActual) {
      const estadoActual = this.inventarioActual.estado;
      const textoEstado =
        estadoActual === 'borrador' ? 'en borrador' : 'finalizado';

      const result = await Swal.fire({
        title: '¿Crear nuevo inventario?',
        text: `Ya existe un inventario ${textoEstado} para esta fecha. ¿Deseas reemplazarlo?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, reemplazar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      // Eliminar el inventario anterior si existe
      if (this.inventarioActual.id) {
        try {
          const inventarioAnteriorRef = doc(
            this.firestore,
            'inventarios',
            this.inventarioActual.id
          );
          await deleteDoc(inventarioAnteriorRef);
        } catch (error) {
          console.error('Error eliminando inventario anterior:', error);
        }
      }
    }

    this.isCreatingInventory = true;
    try {
      // Verificar usuario autenticado antes de continuar
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        Swal.fire('Error', 'Usuario no autenticado', 'error');
        return;
      }

      // Filtrar productos por la categoría seleccionada (productos no combinados)
      const productosFiltrados = this.productos.filter(
        (p) => p.categoriaId === this.categoriaSeleccionada && !p.esCombinado
      );

      // Verificar que hay productos en la categoría
      if (productosFiltrados.length === 0) {
        Swal.fire(
          'Error',
          'No hay productos disponibles en la categoría seleccionada.',
          'error'
        );
        return;
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

          const productoInventario: any = {
            productoId: producto.id || '',
            nombre: producto.nombre || '',
            categoria: categoria?.nombre || 'Sin categoría',
            proveedor: proveedor?.nombre || 'Sin proveedor',
            stockActual: producto.stock || 0,
            stockContado: null, // Inicializar como null para usar placeholder
            costoUnitario: producto.costo || 0,
            valorTotal: (producto.stock || 0) * (producto.costo || 0),
            unidadMedida: producto.unidadMedida || '',
            diferencia: 0,
          };

          // Solo agregar familiaId si existe
          if (producto.familiaId) {
            productoInventario.familiaId = producto.familiaId;
          }

          return productoInventario;
        }
      );

      // Calcular totales
      const inversionTotal = productosInventario.reduce(
        (sum, p) => sum + p.valorTotal,
        0
      );
      const totalProductos = productosInventario.length;
      const totalUnidades = productosInventario.reduce(
        (sum, p) => sum + (p.stockContado ?? 0),
        0
      );
      const costoPromedio =
        totalUnidades > 0 ? inversionTotal / totalUnidades : 0;

      // Crear inventario como borrador
      const inventarioDataRaw: any = {
        fecha: this.fechaSeleccionada.toISOString().split('T')[0],
        categoriaId: this.categoriaSeleccionada || '',
        productos: productosInventario,
        inversionTotal: inversionTotal || 0,
        totalProductos: totalProductos || 0,
        totalUnidades: totalUnidades || 0,
        costoPromedio: costoPromedio || 0,
        fechaCreacion: serverTimestamp(),
        usuarioId: currentUser.id || '',
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
        categoriaId: this.categoriaSeleccionada,
        productos: productosInventario,
        inversionTotal,
        totalProductos,
        totalUnidades,
        costoPromedio,
        fechaCreacion: new Date(),
        usuarioId: currentUser.id,
        estado: 'borrador',
      };

      // Configurar familias disponibles y productos filtrados
      this.configurarFamiliasDisponibles();
      this.aplicarFiltroFamilia();

      this.cerrarModalNuevoInventario();
      const nombreCategoria = this.getNombreCategoriaSeleccionada();
      Swal.fire(
        '¡Creado!',
        `Inventario de ${nombreCategoria} creado con ${totalProductos} productos. Puedes editarlo y luego finalizarlo.`,
        'success'
      );
    } catch (error: any) {
      let mensajeError = 'Error al crear el inventario';

      if (error?.message) {
        mensajeError += ': ' + error.message;
      }

      Swal.fire('Error', mensajeError, 'error');
    } finally {
      this.isCreatingInventory = false;
    }
  }

  // Métodos para filtros por familias
  private configurarFamiliasDisponibles(): void {
    if (!this.inventarioActual) return;

    const familiasSet = new Set<string>();
    const familiasMap = new Map<string, FamiliaCategoria>();

    // Obtener la categoría del inventario actual
    const categoriaInventario = this.categorias.find(
      (c) => c.id === this.inventarioActual?.categoriaId
    );

    if (categoriaInventario?.familias) {
      categoriaInventario.familias.forEach((familia) => {
        if (familia.id && !familiasSet.has(familia.id)) {
          familiasSet.add(familia.id);
          familiasMap.set(familia.id, familia);
        }
      });
    }

    this.familiasDisponibles = Array.from(familiasMap.values());
  }

  filtrarPorFamilia(familiaId: string): void {
    this.familiaSeleccionada = familiaId;
    this.aplicarFiltroFamilia();
  }

  private aplicarFiltroFamilia(): void {
    if (!this.inventarioActual) return;

    // Actualizar productos sin filtrar
    this.productosSinFiltrar = [...this.inventarioActual.productos];

    if (!this.familiaSeleccionada) {
      this.productosFiltrados = [...this.inventarioActual.productos];
    } else {
      this.productosFiltrados = this.inventarioActual.productos.filter(
        (producto) => {
          const productoCompleto = this.productos.find(
            (p) => p.id === producto.productoId
          );
          return productoCompleto?.familiaId === this.familiaSeleccionada;
        }
      );
    }

    // Aplicar búsqueda si hay texto
    if (this.busquedaProducto.trim()) {
      this.filtrarProductosPorBusqueda();
    }
  }

  getProductosPorFamilia(familiaId: string): InventarioProducto[] {
    if (!this.inventarioActual) return [];

    return this.inventarioActual.productos.filter((producto) => {
      const productoCompleto = this.productos.find(
        (p) => p.id === producto.productoId
      );
      return productoCompleto?.familiaId === familiaId;
    });
  }

  getNombreFamiliaSeleccionada(): string {
    const familia = this.familiasDisponibles.find(
      (f) => f.id === this.familiaSeleccionada
    );
    return familia?.nombre || '';
  }

  trackByFamilia(_: number, familia: FamiliaCategoria): string {
    return familia.id || '';
  }

  // Métodos para estadísticas de familias
  getProductosSinContarPorFamilia(familiaId: string): number {
    if (!this.inventarioActual) return 0;

    const productosFamilia = this.getProductosPorFamilia(familiaId);
    return productosFamilia.filter(
      (producto) =>
        producto.stockContado === null || producto.stockContado === undefined
    ).length;
  }

  getCostoTotalPorFamilia(familiaId: string): number {
    if (!this.inventarioActual) return 0;

    const productosFamilia = this.getProductosPorFamilia(familiaId);
    return productosFamilia.reduce((total, producto) => {
      const stockContado = producto.stockContado ?? 0;
      return total + stockContado * producto.costoUnitario;
    }, 0);
  }

  // Formatear moneda de forma más legible
  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Métodos para "Todas las familias"
  getTotalProductosSinContar(): number {
    if (!this.inventarioActual) return 0;

    return this.inventarioActual.productos.filter(
      (producto) =>
        producto.stockContado === null || producto.stockContado === undefined
    ).length;
  }

  getCostoTotalInventario(): number {
    if (!this.inventarioActual) return 0;

    return this.inventarioActual.productos.reduce((total, producto) => {
      const stockContado = producto.stockContado ?? 0;
      return total + stockContado * producto.costoUnitario;
    }, 0);
  }

  // Filtrar familias que tienen productos
  getFamiliasConProductos(): FamiliaCategoria[] {
    if (!this.familiasDisponibles) return [];

    return this.familiasDisponibles.filter((familia) => {
      const cantidadProductos = this.getProductosPorFamilia(
        familia.id || ''
      ).length;
      return cantidadProductos > 0;
    });
  }

  // Métodos de búsqueda de productos
  filtrarProductosPorBusqueda(): void {
    if (!this.inventarioActual) return;

    // Guardar productos sin filtrar si es la primera vez
    if (this.productosSinFiltrar.length === 0) {
      this.productosSinFiltrar = [...this.inventarioActual.productos];
    }

    let productosBase = this.productosSinFiltrar;

    // Aplicar filtro de familia si está activo
    if (this.familiaSeleccionada) {
      productosBase = this.productosSinFiltrar.filter((producto) => {
        const productoCompleto = this.productos.find(
          (p) => p.id === producto.productoId
        );
        return productoCompleto?.familiaId === this.familiaSeleccionada;
      });
    }

    // Aplicar filtro de búsqueda
    if (!this.busquedaProducto.trim()) {
      this.productosFiltrados = [...productosBase];
      return;
    }

    const busqueda = this.busquedaProducto.toLowerCase().trim();
    this.productosFiltrados = productosBase.filter((producto) => {
      const productoCompleto = this.productos.find(
        (p) => p.id === producto.productoId
      );

      if (!productoCompleto) return false;

      // Buscar en nombre del producto
      const nombreCoincide = productoCompleto.nombre
        .toLowerCase()
        .includes(busqueda);

      // Buscar en categoría
      const categoria = this.categorias.find(
        (c) => c.id === productoCompleto.categoriaId
      );
      const categoriaCoincide =
        categoria?.nombre.toLowerCase().includes(busqueda) || false;

      // Buscar en proveedor
      const proveedor = this.proveedores.find(
        (p) => p.id === productoCompleto.proveedorId
      );
      const proveedorCoincide =
        proveedor?.nombre.toLowerCase().includes(busqueda) || false;

      return nombreCoincide || categoriaCoincide || proveedorCoincide;
    });
  }

  limpiarBusqueda(): void {
    this.busquedaProducto = '';
    this.filtrarProductosPorBusqueda();
  }

  limpiarTodosFiltros(): void {
    this.busquedaProducto = '';
    this.familiaSeleccionada = '';
    this.aplicarFiltroFamilia();
  }

  // Métodos para el historial de inventarios
  async abrirModalHistorial(): Promise<void> {
    const modalEl = document.getElementById('modalHistorial');
    if (modalEl) {
      this.modalHistorial = new bootstrap.Modal(modalEl);
      this.modalHistorial.show();
      await this.cargarHistorial();
    }
  }

  cerrarModalHistorial(): void {
    if (this.modalHistorial) {
      this.modalHistorial.hide();
    }
  }

  async cargarHistorial(): Promise<void> {
    this.isLoadingHistorial = true;
    try {
      const inventariosRef = collection(this.firestore, 'inventarios');

      // Usar query con límite para mejor rendimiento
      const limite = parseInt(this.historialLimite);
      const querySnapshot = await getDocs(inventariosRef);

      this.historialInventarios = [];
      const inventariosTemp: Inventario[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data['eliminado']) {
          // Solo incluir inventarios no eliminados
          const inventario = {
            id: doc.id,
            ...data,
            fecha: this.convertirFecha(data['fecha']) || data['fecha'],
            fechaCreacion: this.convertirFecha(data['fechaCreacion']),
            fechaActualizacion: this.convertirFecha(data['fechaActualizacion']),
          } as Inventario;
          inventariosTemp.push(inventario);
        }
      });

      // Ordenar por fecha de creación (más recientes primero) y limitar
      inventariosTemp.sort((a, b) => {
        const fechaA = a.fechaCreacion || new Date(0);
        const fechaB = b.fechaCreacion || new Date(0);
        return fechaB.getTime() - fechaA.getTime();
      });

      // Aplicar límite
      this.historialInventarios = inventariosTemp.slice(0, limite);

      this.filtrarHistorial();

      console.log(
        `Historial cargado: ${this.historialInventarios.length} inventarios`
      );
    } catch (error) {
      console.error('Error cargando historial:', error);
      Swal.fire(
        'Error',
        'Error al cargar el historial de inventarios',
        'error'
      );
    } finally {
      this.isLoadingHistorial = false;
    }
  }

  filtrarHistorial(): void {
    this.historialFiltrado = this.historialInventarios.filter((inventario) => {
      const cumpleCategoria =
        !this.historialFiltroCategoria ||
        inventario.categoriaId === this.historialFiltroCategoria;
      const cumpleEstado =
        !this.historialFiltroEstado ||
        inventario.estado === this.historialFiltroEstado;

      return cumpleCategoria && cumpleEstado;
    });
  }

  cargarInventarioDesdeHistorial(inventario: Inventario): void {
    // Establecer la fecha seleccionada
    this.fechaSeleccionada = new Date(inventario.fecha);
    this.fechaFiltro.setValue(
      this.fechaSeleccionada.toISOString().split('T')[0]
    );

    // Cargar el inventario
    this.inventarioActual = { ...inventario };

    // Configurar familias y filtros
    this.configurarFamiliasDisponibles();
    this.aplicarFiltroFamilia();

    // Cerrar modal
    this.cerrarModalHistorial();

    Swal.fire({
      title: 'Inventario cargado',
      text: `Se ha cargado el inventario del ${inventario.fecha}`,
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
    });
  }

  async eliminarInventarioHistorial(inventario: Inventario): Promise<void> {
    if (inventario.estado === 'finalizado') {
      Swal.fire(
        'Error',
        'No se pueden eliminar inventarios finalizados',
        'error'
      );
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar inventario?',
      text: `Se eliminará el inventario del ${inventario.fecha}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      if (inventario.id) {
        const inventarioRef = doc(this.firestore, 'inventarios', inventario.id);
        await deleteDoc(inventarioRef);

        // Recargar historial
        await this.cargarHistorial();

        // Si era el inventario actual, limpiarlo
        if (this.inventarioActual?.id === inventario.id) {
          this.inventarioActual = null;
          this.familiasDisponibles = [];
          this.familiaSeleccionada = '';
          this.productosFiltrados = [];
        }

        Swal.fire('¡Eliminado!', 'El inventario ha sido eliminado', 'success');
      }
    } catch (error) {
      console.error('Error eliminando inventario:', error);
      Swal.fire('Error', 'Error al eliminar el inventario', 'error');
    }
  }

  getCategoriaNombre(categoriaId?: string): string {
    if (!categoriaId) return 'Sin categoría';
    const categoria = this.categorias.find((c) => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  }

  // Métodos para agregar productos
  abrirModalAgregarProductos(): void {
    if (
      !this.inventarioActual ||
      this.inventarioActual.estado === 'finalizado'
    ) {
      Swal.fire('Error', 'No hay inventario activo o está finalizado', 'error');
      return;
    }

    // Cargar productos ANTES de abrir el modal para que aparezcan inmediatamente
    this.cargarProductosDisponibles();

    const modalEl = document.getElementById('modalAgregarProductos');
    if (modalEl) {
      this.modalAgregarProductos = new bootstrap.Modal(modalEl);
      this.modalAgregarProductos.show();
    }
  }

  cerrarModalAgregarProductos(): void {
    if (this.modalAgregarProductos) {
      this.modalAgregarProductos.hide();
    }
    this.limpiarSeleccionProductos();
  }

  cargarProductosDisponibles(): void {
    if (!this.inventarioActual) {
      this.productosDisponiblesParaAgregar = [];
      return;
    }

    // Obtener IDs de productos ya en el inventario (optimizado)
    const productosEnInventario = new Set(
      this.inventarioActual.productos.map((p) => p.productoId)
    );

    // Filtrar productos de la misma categoría que no estén en el inventario (optimizado)
    this.productosDisponiblesParaAgregar = this.productos.filter((producto) => {
      // Verificaciones rápidas primero
      if (!producto.id || producto.esCombinado) return false;
      if (producto.categoriaId !== this.inventarioActual?.categoriaId)
        return false;
      if (productosEnInventario.has(producto.id)) return false;

      return true;
    });

    // Limpiar búsqueda
    this.busquedaProductosNuevos = '';

    console.log(
      `Productos disponibles para agregar: ${this.productosDisponiblesParaAgregar.length}`
    );
  }

  filtrarProductosNuevos(): void {
    if (!this.busquedaProductosNuevos.trim()) {
      this.cargarProductosDisponibles();
      return;
    }

    const busqueda = this.busquedaProductosNuevos.toLowerCase();
    const productosEnInventario = new Set(
      this.inventarioActual?.productos.map((p) => p.productoId) || []
    );

    this.productosDisponiblesParaAgregar = this.productos.filter(
      (producto) =>
        producto.categoriaId === this.inventarioActual?.categoriaId &&
        !producto.esCombinado &&
        !productosEnInventario.has(producto.id!) &&
        producto.nombre.toLowerCase().includes(busqueda)
    );
  }

  toggleProductoSeleccionado(productoId: string, event: any): void {
    if (event.target.checked) {
      this.productosSeleccionadosParaAgregar.add(productoId);
    } else {
      this.productosSeleccionadosParaAgregar.delete(productoId);
    }
  }

  toggleTodosProductos(event: any): void {
    if (event.target.checked) {
      this.productosDisponiblesParaAgregar.forEach((producto) => {
        if (producto.id) {
          this.productosSeleccionadosParaAgregar.add(producto.id);
        }
      });
    } else {
      this.productosSeleccionadosParaAgregar.clear();
    }
  }

  todosProductosSeleccionados(): boolean {
    return (
      this.productosDisponiblesParaAgregar.length > 0 &&
      this.productosDisponiblesParaAgregar.every(
        (producto) =>
          producto.id && this.productosSeleccionadosParaAgregar.has(producto.id)
      )
    );
  }

  async agregarProductosSeleccionados(): Promise<void> {
    if (
      this.productosSeleccionadosParaAgregar.size === 0 ||
      !this.inventarioActual
    ) {
      return;
    }

    this.isAgregarProductos = true;
    try {
      // Crear nuevos productos para el inventario
      const nuevosProductos: InventarioProducto[] = [];

      this.productosSeleccionadosParaAgregar.forEach((productoId) => {
        const producto = this.productos.find((p) => p.id === productoId);
        if (producto) {
          const categoria = this.categorias.find(
            (c) => c.id === producto.categoriaId
          );
          const proveedor = this.proveedores.find(
            (p) => p.id === producto.proveedorId
          );

          const nuevoProducto: InventarioProducto = {
            productoId: producto.id!,
            nombre: producto.nombre,
            categoria: categoria?.nombre || 'Sin categoría',
            proveedor: proveedor?.nombre || 'Sin proveedor',
            stockActual: producto.stock || 0,
            stockContado: null,
            costoUnitario: producto.costo,
            valorTotal: (producto.stock || 0) * producto.costo,
            unidadMedida: producto.unidadMedida,
            diferencia: 0,
          };

          // Agregar familiaId si existe
          if (producto.familiaId) {
            (nuevoProducto as any).familiaId = producto.familiaId;
          }

          nuevosProductos.push(nuevoProducto);
        }
      });

      // Agregar productos al inventario actual
      this.inventarioActual.productos.push(...nuevosProductos);
      this.inventarioActual.totalProductos =
        this.inventarioActual.productos.length;

      // Recalcular totales
      this.recalcularTotales();

      // Guardar en Firebase
      if (this.inventarioActual.id) {
        const inventarioRef = doc(
          this.firestore,
          'inventarios',
          this.inventarioActual.id
        );
        await updateDoc(inventarioRef, {
          productos: this.inventarioActual.productos,
          totalProductos: this.inventarioActual.totalProductos,
          inversionTotal: this.inventarioActual.inversionTotal,
          totalUnidades: this.inventarioActual.totalUnidades,
          costoPromedio: this.inventarioActual.costoPromedio,
          fechaActualizacion: serverTimestamp(),
        });
      }

      // Reconfigurar familias y filtros
      this.configurarFamiliasDisponibles();
      this.aplicarFiltroFamilia();

      this.cerrarModalAgregarProductos();

      Swal.fire(
        '¡Productos agregados!',
        `Se agregaron ${nuevosProductos.length} productos al inventario`,
        'success'
      );
    } catch (error) {
      console.error('Error agregando productos:', error);
      Swal.fire('Error', 'Error al agregar productos al inventario', 'error');
    } finally {
      this.isAgregarProductos = false;
    }
  }

  limpiarSeleccionProductos(): void {
    this.productosSeleccionadosParaAgregar.clear();
    this.busquedaProductosNuevos = '';
    this.productosDisponiblesParaAgregar = [];
  }
}
