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
            stockContado: producto.stock || 0,
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
        (sum, p) => sum + p.stockContado,
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
}
