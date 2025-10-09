import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { PersonalizacionService } from '../personalizacion.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private router: Router,
    private firestore: Firestore,
    private personalizacionService: PersonalizacionService
  ) {
    // this.firestore = getFirestore();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(
        usuariosRef,
        where('email', '==', email),
        where('password', '==', password), // ⚠️ En producción, usar hash de contraseña
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Actualizar último acceso
        await this.updateLastAccess(userDoc.id);

        this.saveUserData({
          id: userDoc.id,
          nombre: userData['nombre'],
          email: userData['email'],
          rol: userData['rol'],
          permisos: userData['permisos'] || [],
          telefono: userData['telefono'] || '',
        });

        // Cargar personalización del usuario después del login
        await this.personalizacionService.cargarPersonalizacionUsuario(
          userDoc.id
        );

        this.router.navigate(['/private']);
        return true;
      } else {
        console.warn('Credenciales inválidas o usuario inactivo');
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  logout(): void {
    this.clearUserData();
    // Resetear personalización a valores por defecto
    this.personalizacionService.resetearADefecto();
    this.router.navigate(['/public/sign-in']);
  }

  private _isLoggedIn: boolean | null = null;

  isLoggedIn(): boolean {
    // Cache el resultado para evitar múltiples llamadas a localStorage
    if (this._isLoggedIn === null) {
      const userId = localStorage.getItem('userId');
      this._isLoggedIn = !!userId;
      console.log('AuthService.isLoggedIn() - userId:', userId);
    }
    return this._isLoggedIn;
  }

  getCurrentUser(): any {
    if (!this.isLoggedIn()) return null;

    const userId = localStorage.getItem('userId');
    return {
      id: userId,
      uid: userId, // Alias para compatibilidad con Firebase Auth
      nombre: localStorage.getItem('nombre'),
      email: localStorage.getItem('email'),
      rol: localStorage.getItem('rol'),
      permisos: JSON.parse(localStorage.getItem('permisos') || '[]'),
      telefono: localStorage.getItem('telefono'),
    };
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // ROOT tiene todos los permisos
    if (user.rol === 'ROOT') return true;

    // Administrador tiene todos los permisos excepto app_shutdown
    if (user.rol === 'Administrador' && permission !== 'app_shutdown')
      return true;

    return user.permisos.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  private async updateLastAccess(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'usuarios', userId);
      await updateDoc(userRef, {
        ultimoAcceso: new Date(),
      });
    } catch (error) {
      console.error('Error actualizando último acceso:', error);
    }
  }

  private saveUserData(data: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    permisos: string[];
    telefono: string;
  }) {
    localStorage.setItem('userId', data.id);
    localStorage.setItem('nombre', data.nombre);
    localStorage.setItem('email', data.email);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('permisos', JSON.stringify(data.permisos));
    localStorage.setItem('telefono', data.telefono);
    // Actualizar cache
    this._isLoggedIn = true;
  }

  private clearUserData() {
    localStorage.removeItem('userId');
    localStorage.removeItem('nombre');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
    localStorage.removeItem('permisos');
    localStorage.removeItem('telefono');
    // Actualizar cache
    this._isLoggedIn = false;
  }
}
