import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Televisor,
  CreateTelevisorRequest,
  UpdateTelevisorRequest,
} from '../models/televisor.model';

@Injectable({
  providedIn: 'root',
})
export class TelevisorService {
  private collection = 'televisores';

  constructor(private firestore: AngularFirestore) {}

  // Obtener todos los televisores
  getTelevisores(): Observable<Televisor[]> {
    return this.firestore
      .collection<Televisor>(this.collection)
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Televisor;
            return { ...data, id: a.payload.doc.id };
          })
        )
      );
  }

  // Obtener televisores por cliente
  getTelevisoresByCliente(clienteId: string): Observable<Televisor[]> {
    return this.firestore
      .collection<Televisor>(this.collection, (ref) =>
        ref.where('clienteId', '==', clienteId)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Televisor;
            return { ...data, id: a.payload.doc.id };
          })
        )
      );
  }

  // Obtener un televisor por ID
  getTelevisorById(id: string): Observable<Televisor | undefined> {
    return this.firestore
      .doc<Televisor>(`${this.collection}/${id}`)
      .valueChanges({ idField: 'id' });
  }

  // Crear un nuevo televisor
  createTelevisor(televisor: CreateTelevisorRequest): Promise<any> {
    const televisorData = {
      ...televisor,
      activo: televisor.activo ?? true,
      estado: televisor.estado ?? 'Activo',
      ultimaConexion: new Date(),
      fechaCreacion: new Date(),
      configuracion: {
        resolucion: '1920x1080',
        orientacion: 'horizontal',
        tiempoTransicion: 5000,
        ...televisor.configuracion,
      },
      imagenes: 0,
    };

    return this.firestore.collection(this.collection).add(televisorData);
  }

  // Actualizar un televisor
  updateTelevisor(
    id: string,
    televisor: UpdateTelevisorRequest
  ): Promise<void> {
    return this.firestore.doc(`${this.collection}/${id}`).update(televisor);
  }

  // Eliminar un televisor
  deleteTelevisor(id: string): Promise<void> {
    return this.firestore.doc(`${this.collection}/${id}`).delete();
  }

  // Asignar televisor a un cliente
  asignarTelevisorACliente(
    televisorId: string,
    clienteId: string,
    clienteNombre: string
  ): Promise<void> {
    return this.firestore.doc(`${this.collection}/${televisorId}`).update({
      clienteId,
      clienteNombre,
    });
  }

  // Desasignar televisor de un cliente
  desasignarTelevisorDeCliente(televisorId: string): Promise<void> {
    return this.firestore.doc(`${this.collection}/${televisorId}`).update({
      clienteId: null,
      clienteNombre: null,
    });
  }

  // Actualizar el estado de un televisor
  actualizarEstado(
    televisorId: string,
    estado: 'Activo' | 'Desconectado' | 'En_linea'
  ): Promise<void> {
    return this.firestore.doc(`${this.collection}/${televisorId}`).update({
      estado,
      ultimaConexion: new Date(),
    });
  }

  // Obtener televisores activos
  getTelevisoresActivos(): Observable<Televisor[]> {
    return this.firestore
      .collection<Televisor>(this.collection, (ref) =>
        ref.where('activo', '==', true)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Televisor;
            return { ...data, id: a.payload.doc.id };
          })
        )
      );
  }

  // Obtener televisores sin asignar
  getTelevisoresSinAsignar(): Observable<Televisor[]> {
    return this.firestore
      .collection<Televisor>(this.collection, (ref) =>
        ref.where('clienteId', '==', null)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Televisor;
            return { ...data, id: a.payload.doc.id };
          })
        )
      );
  }

  // Contar televisores por cliente
  contarTelevisoresPorCliente(clienteId: string): Observable<number> {
    return this.getTelevisoresByCliente(clienteId).pipe(
      map((televisores) => televisores.length)
    );
  }
}