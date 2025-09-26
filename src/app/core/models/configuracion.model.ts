export interface ConfiguracionEmpresa {
  id?: string;
  nombreRestaurante: string;
  razonSocial: string;
  cif: string;
  telefono: string;
  email: string;
  sitioWeb?: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface InformacionSistema {
  nombre: string;
  version: string;
  descripcion: string;
  fechaLanzamiento: string;
  equipo: {
    ceo: {
      nombre: string;
      telefono: string;
      pais: string;
      bandera: string;
    };
    cto: {
      nombre: string;
      telefono: string;
      pais: string;
      bandera: string;
    };
    designer: {
      nombre: string;
      pais: string;
      bandera: string;
    };
  };
}

export interface PersonalizacionSistema {
  id?: string;
  colorPrincipal: string;
  colorSidebar: string;
  colorSidebarSecundario: string;
  colorTextoSidebar: string;
  colorHoverSidebar: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}
