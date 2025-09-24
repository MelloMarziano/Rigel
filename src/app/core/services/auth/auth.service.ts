import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  ;

  constructor(private router: Router, private firestore: Firestore) {
    // this.firestore = getFirestore();
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(
        usuariosRef,
        where('username', '==', username),
        where('password', '==', password) // ⚠️ asegúrate de encriptarlo si es posible
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        this.saveUserData({
          nombre: userData['nombre'],
          username: userData['username'],
          role: userData['role'],
          empresaId: userData['empresaID']
        });

        this.router.navigate(['/private']);
        return true;
      } else {
        console.warn('Credenciales inválidas');
        return false;
      }
    } catch (error) {
      console.error('Error en login personalizado:', error);
      return false;
    }
  }

  logout(): void {
    this.clearUserData();
    this.router.navigate(['/public/sign-in']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('username');
  }

  private saveUserData(data: { nombre: string, username: string, role: string, empresaId: string }) {
    localStorage.setItem('username', data.username);
    localStorage.setItem('nombre', data.nombre);
    localStorage.setItem('role', data.role);
    localStorage.setItem('empresaId', data.empresaId);
  }

  private clearUserData() {
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
    localStorage.removeItem('role');
    localStorage.removeItem('empresaId');
  }
}
