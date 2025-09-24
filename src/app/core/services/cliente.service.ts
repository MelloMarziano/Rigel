import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Cliente, CreateClienteRequest, UpdateClienteRequest } from '../models/cliente.model';
import { TelevisorService } from './televisor.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private collection = 'clientes';

  constructor(private firestore: AngularFirestore, private televisorService: TelevisorService) {}

  getClientes(): Observable<Cliente[]> {
    return this.firestore
      .collection<Cliente>(this.collection)
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Cliente;
            return { ...data, id: a.payload.doc.id };
          })
        ),
        switchMap((clientes) => {
          // Si no hay clientes, retornar array vacío
          if (clientes.length === 0) {
            return [[]];
          }
          
          // Para cada cliente, obtener el conteo de televisores
          const clientesConTvs = clientes.map((cliente) =>
            this.televisorService.contarTelevisoresPorCliente(cliente.id).pipe(
              map((conteoTvs) => ({
                ...cliente,
                televisores: new Array(conteoTvs).fill(null)
              }))
            )
          );
          
          // Combinar todos los observables
          return combineLatest(clientesConTvs);
        })
      );
  }

  getClienteById(id: string): Observable<Cliente | undefined> {
    return this.firestore.doc<Cliente>(`${this.collection}/${id}`)
      .valueChanges({ idField: 'id' });
  }

  createCliente(cliente: CreateClienteRequest): Promise<any> {
    const clienteData = {
      ...cliente,
      activo: cliente.activo ?? true,
      fechaCreacion: new Date(),
      configuracion: {
        rotacionAutomatica: true,
        tiempoRotacion: 5000,
        horarioOperacion: {
          inicio: '08:00',
          fin: '18:00'
        },
        ...cliente.configuracion
      }
    };
    
    return this.firestore.collection(this.collection).add(clienteData);
  }

  updateCliente(id: string, cliente: UpdateClienteRequest): Promise<void> {
    return this.firestore.doc(`${this.collection}/${id}`).update(cliente);
  }

  deleteCliente(id: string): Promise<void> {
    return this.firestore.doc(`${this.collection}/${id}`).delete();
  }

  getClientesActivos(): Observable<Cliente[]> {
    return this.firestore.collection<Cliente>(this.collection, ref => 
      ref.where('activo', '==', true)
    ).snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Cliente;
          return { ...data, id: a.payload.doc.id };
        }))
      );
  }
}