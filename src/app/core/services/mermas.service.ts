import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Merma {
  id?: string;
  tipo?: 'cocina' | 'producto';
  productoId: string;
  nombre: string;
  descripcion: string;
  porcentajeMerma: number;
  activo: boolean;
  // Campos para merma de producto
  cantidadPerdida?: number;
  unidadMedida?: string;
  costoPerdida?: number;
  motivo?: string;
  fechaRegistro?: any;
  // Campos de auditoría
  fechaCreacion?: any;
  fechaActualizacion?: any;
}

@Injectable({
  providedIn: 'root',
})
export class MermasService {
  constructor(private firestore: Firestore) {}

  getMermas(): Observable<Merma[]> {
    const mermasRef = collection(this.firestore, 'mermas');
    return collectionData(mermasRef, { idField: 'id' }) as Observable<Merma[]>;
  }

  getMermasActivas(): Observable<Merma[]> {
    return this.getMermas().pipe(
      map((mermas) => mermas.filter((m) => m.activo))
    );
  }

  // Obtener solo mermas de cocina activas (para usar en escandallos)
  getMermasCocinaActivas(): Observable<Merma[]> {
    return this.getMermas().pipe(
      map((mermas) =>
        mermas.filter((m) => m.activo && (!m.tipo || m.tipo === 'cocina'))
      )
    );
  }

  // Obtener mermas de producto (para reportes)
  getMermasProducto(): Observable<Merma[]> {
    return this.getMermas().pipe(
      map((mermas) => mermas.filter((m) => m.tipo === 'producto'))
    );
  }

  getMermaPorProducto(productoId: string): Observable<Merma | undefined> {
    return this.getMermasCocinaActivas().pipe(
      map((mermas) => mermas.find((m) => m.productoId === productoId))
    );
  }

  async crearMerma(merma: Omit<Merma, 'id'>): Promise<void> {
    const mermasRef = collection(this.firestore, 'mermas');
    const mermaData = {
      ...merma,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: new Date(),
    };
    await addDoc(mermasRef, mermaData);
  }

  async actualizarMerma(id: string, merma: Partial<Merma>): Promise<void> {
    const mermaRef = doc(this.firestore, 'mermas', id);
    const mermaData = {
      ...merma,
      fechaActualizacion: new Date(),
    };
    await updateDoc(mermaRef, mermaData);
  }

  async eliminarMerma(id: string): Promise<void> {
    const mermaRef = doc(this.firestore, 'mermas', id);
    await deleteDoc(mermaRef);
  }

  calcularCantidadUtil(cantidad: number, porcentajeMerma: number): number {
    return cantidad - (cantidad * porcentajeMerma) / 100;
  }

  calcularPerdida(cantidad: number, porcentajeMerma: number): number {
    return (cantidad * porcentajeMerma) / 100;
  }

  calcularCantidadNecesaria(
    cantidadUtil: number,
    porcentajeMerma: number
  ): number {
    // Calcula cuánto necesitas comprar para obtener la cantidad útil deseada
    return cantidadUtil / (1 - porcentajeMerma / 100);
  }
}
