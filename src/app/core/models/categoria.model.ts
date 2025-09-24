export interface Categoria {
  id?: string;
  nombre: string;
  descripcion: string;
  icono: string;
  colorFondo: string;
  productos: number;
  unidadesDisponibles: string[];
}

export interface Stats {
  totalCategorias: number;
  totalProductos: number;
  unidadesMedida: number;
  productosCombo: number;
}
