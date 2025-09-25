export interface Receta {
  id?: string;
  nombre: string;
  tipo: 'Cocteles' | 'Platos';
  descripcion: string;
  precioVenta: number;
  ingredientes: IngredienteReceta[];
  costoTotal?: number;
  margen?: number;
  disponible?: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface IngredienteReceta {
  productoId: string;
  cantidad: number;
  unidad: string;
  costo?: number;
  nombre?: string; // Para mostrar en la UI
}

export interface EstadisticasRecetas {
  totalRecetas: number;
  cocteles: number;
  platos: number;
  ingredientesTotales: number;
}
