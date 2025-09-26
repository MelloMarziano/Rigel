export interface FamiliaCategoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  productos: number;
}

export interface Categoria {
  id?: string;
  nombre: string;
  descripcion: string;
  icono: string;
  colorFondo: string;
  productos: number;
  unidadesDisponibles: string[];
  familias: FamiliaCategoria[];
}

export interface Stats {
  totalCategorias: number;
  totalProductos: number;
  unidadesMedida: number;
  productosCombo: number;
}
