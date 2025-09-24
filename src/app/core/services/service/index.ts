export interface ServiciosModel {
    status: string;
    code: number;
    message: string;
    data: ServiciosDataModel[];
}

export interface ServiciosDataModel {
    f_iddetalle: number;
    f_idservicio: number;
    f_rnc_principal: string;
    f_email_principal: string;
    f_fecha_creacion: Date;
    f_app: number;
    f_usuario: number;
    f_codigo_servicio: string;
    f_nombre_servicio: string;
    f_categoria: string;
    f_precio: string;
    f_duracion_horas: number;
    f_estado: string;
}
