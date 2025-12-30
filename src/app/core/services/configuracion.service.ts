import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, limit } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ConfiguracionEmpresa } from '../models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private _configuracion = new BehaviorSubject<ConfiguracionEmpresa | null>(null);
  public configuracion$ = this._configuracion.asObservable();

  constructor(private firestore: Firestore) {
    this.cargarConfiguracion();
  }

  private cargarConfiguracion() {
    const configuracionRef = collection(this.firestore, 'configuracion');
    const q = query(configuracionRef, limit(1));

    collectionData(q, { idField: 'id' }).pipe(
      map(configs => configs.length > 0 ? configs[0] as ConfiguracionEmpresa : null),
      tap(config => {
        if (config) {
          // Asegurar valores por defecto si no existen
          if (!config.moneda) config.moneda = 'EUR';
          if (!config.simboloMoneda) config.simboloMoneda = '€';
        }
        this._configuracion.next(config);
      }),
      shareReplay(1)
    ).subscribe();
  }

  getConfiguracionActual(): ConfiguracionEmpresa | null {
    return this._configuracion.value;
  }
}
