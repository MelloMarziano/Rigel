export interface Inventario {
  id?: string;
  fecha: Date | string | any; // Permitir diferentes tipos para Firebase
  categoriaId?: string;
  proveedorId?: string;
  productos: InventarioProducto[];
  inversionTotal: number;
  totalProductos: number;
  totalUnidades: number;
  costoPromedio: number;
  fechaCreacion?: Date | any; // Permitir Timestamp de Firebase
  usuarioId?: string;
  estado: 'borrador' | 'finalizado';
  fechaActualizacion?: Date | any; // Permitir Timestamp de Firebase
}

export interface InventarioProducto {
  productoId: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  stockActual: number;
  stockContado: number;
  costoUnitario: number;
  valorTotal: number;
  unidadMedida: string;
  diferencia: number;
}
