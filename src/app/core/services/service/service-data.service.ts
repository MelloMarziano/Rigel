import { Injectable } from '@angular/core';
import { HttpInvokeService } from '../http-invoke.service'
import { Observable } from 'rxjs';
import { ServiciosDataModel } from '.';

@Injectable({
    providedIn: 'root'
})
export class ServiceDataService {


    constructor(private http: HttpInvokeService) {
    }


    saveNewService(serviceData: any): Observable<any> {
        const url = 'api/servicios';
        return this.http.PostRequest<any, any>(url, serviceData);
    }

    getServices(): Observable<any> {
        return this.http.GetRequest('api/servicios');
    }


    // getCompanyById(clienteId: number): Observable<any> {
    //     return this.http.GetRequest(`api/company/${clienteId}`);
    // }

    // deleteCompany(clienteId: number): Observable<any> {
    //     return this.http.DeleteRequest(`api/company/${clienteId}`, '');
    // }

    updateService(servicioID: number, servicio: ServiciosDataModel): Observable<any> {
        return this.http.PutRequest(`api/servicios/${servicioID}`, servicio);
    }
}
