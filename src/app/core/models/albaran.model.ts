export interface Albaran {
  id?: string;
  numero: string;
  proveedorId: string;
  proveedorNombre?: string;
  proveedorCif?: string;
  estado: 'Pendiente' | 'Parcial' | 'Recibido';
  fechaEmision: Date;
  fechaEntrega: Date;
  recibidoPor?: string;
  observaciones?: string;
  productos: ProductoAlbaran[];
  subtotal: number;
  iva: number;
  total: number;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface ProductoAlbaran {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  IVA?: number;
  cantidadRecibida?: number;
}

export interface EstadisticasAlbaranes {
  totalAlbaranes: number;
  recibidos: number;
  pendientes: number;
  valorTotal: number;
}
