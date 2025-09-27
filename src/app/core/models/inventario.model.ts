export interface Inventario {
  id?: string;
  fecha: Date | string | any; // Permitir diferentes tipos para Firebase
  area?: 'barra' | 'cocina'; // Nueva propiedad para el área
  categoriasSeleccionadas?: string[]; // Categorías seleccionadas para el inventario
  categoriaId?: string; // Mantener por compatibilidad
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
  stockContado: number | null;
  costoUnitario: number;
  valorTotal: number;
  unidadMedida: string;
  diferencia: number;
  familiaId?: string; // Nueva propiedad para filtrar por familia
}
