export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  IVA: number;
  categoriaId: string;
  proveedorId?: string; // Optional
  stock?: number;
  stockMinimo?: number;
  esCombinado: boolean;
  cantidad: number;
  unidadMedida: string;
}
