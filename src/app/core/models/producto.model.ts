export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  IVA: number;
  categoriaId: string;
  familiaId?: string; // ID de la familia dentro de la categoría
  proveedorId?: string; // Optional
  stock?: number;
  stockMinimo?: number;
  esCombinado: boolean;
  cantidad: number;
  unidadMedida: string;
}
