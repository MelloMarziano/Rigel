import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private collection = 'usuarios';

  constructor(private firestore: AngularFirestore) {}

  /**
   * Obtiene todos los usuarios de la colección 'usuarios'.
   * @returns Observable de un array de usuarios.
   */
  getUsers(): Observable<User[]> {
    return this.firestore
      .collection<User>(this.collection)
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as User;
            const id = a.payload.doc.id;

            // Convertir Firestore Timestamp a Date de JavaScript
            if (
              data.fechaCreacion &&
              typeof data.fechaCreacion === 'object' &&
              'toDate' in (data.fechaCreacion as any)
            ) {
              data.fechaCreacion = (data.fechaCreacion as any).toDate();
            }

            return { id, ...data };
          })
        )
      );
  }

  /**
   * Obtiene un usuario por su ID.
   * @param id ID del usuario.
   * @returns Observable del usuario.
   */
  getUserById(id: string): Observable<User | undefined> {
    return this.firestore
      .collection<User>(this.collection)
      .doc(id)
      .valueChanges()
      .pipe(take(1));
  }

  /**
   * Crea un nuevo usuario en Firestore.
   * @param user Datos del usuario a crear.
   * @returns Promesa que se resuelve cuando el usuario es creado.
   *
   * !!! ADVERTENCIA DE SEGURIDAD CRÍTICA !!!
   * En un entorno de producción, la contraseña NUNCA debe almacenarse en texto plano.
   * Debe ser hasheada (ej. con bcrypt) en un entorno seguro (backend) antes de guardarse.
   * Esta implementación es solo para fines de demostración/prototipado.
   */
  async createUser(user: User): Promise<void> {
    // En un entorno real, aquí se hashearía la contraseña antes de añadirla.
    
    const userToSave: Omit<User, 'id'> = { ...user, fechaCreacion: new Date() };
    await this.firestore.collection(this.collection).add(userToSave);
  }

  /**
   * Actualiza un usuario existente en Firestore.
   * @param user Datos del usuario a actualizar (debe incluir el ID).
   * @returns Promesa que se resuelve cuando el usuario es actualizado.
   *
   * !!! ADVERTENCIA DE SEGURIDAD CRÍTICA !!!
   * Si se permite actualizar la contraseña, debe ser hasheada de forma segura.
   */
  async updateUser(user: User): Promise<void> {
    if (!user.id) {
      throw new Error('El usuario debe tener un ID para ser actualizado.');
    }
    // En un entorno real, si user.password se actualiza, también debería hashearse aquí.
    const { id, ...userToUpdate } = user;
    await this.firestore
      .collection(this.collection)
      .doc(user.id)
      .update(userToUpdate);
  }

  /**
   * Elimina un usuario de Firestore por su ID.
   * @param id ID del usuario a eliminar.
   * @returns Promesa que se resuelve cuando el usuario es eliminado.
   */
  async deleteUser(id: string): Promise<void> {
    await this.firestore.collection(this.collection).doc(id).delete();
  }
}
