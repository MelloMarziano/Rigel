export interface Proveedor {
  id: string;
  nombre: string;
  cif: string;
  razonSocial: string;
  contacto: {
    nombre: string;
    email: string;
    telefono: string;
  };
  direccion: {
    calle: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
  };
  iban?: string;
  plazoPago: number;
  descuento: number;
  activo: boolean;
  productos: string[]; // Array of product IDs
  fechaCreacion: any; // Using 'any' to be compatible with Firestore's serverTimestamp
  metodoPago?: string;
}
