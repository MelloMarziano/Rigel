import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SeedService {
  constructor(private firestore: Firestore) {}

  async createDefaultUsers(): Promise<void> {
    const usuariosRef = collection(this.firestore, 'usuarios');

    // Verificar si ya existen los usuarios de prueba específicos
    const emails = [
      'root@orionsystem.com',
      'admin@orionsystem.com',
      'gerente@orionsystem.com',
      'empleado@orionsystem.com',
      'visualizador@orionsystem.com',
    ];

    let existingTestUsers = 0;
    for (const email of emails) {
      const q = query(usuariosRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        existingTestUsers++;
      }
    }

    if (existingTestUsers === emails.length) {
      console.log('Todos los usuarios de prueba ya existen');
      return;
    }

    const defaultUsers = [
      {
        nombre: 'Alberto Ortega ROOT',
        email: 'root@orionsystem.com',
        telefono: '+34 673 90 59 91',
        rol: 'ROOT',
        permisos: [
          'dashboard',
          'productos',
          'categorias',
          'recetas',
          'ventas',
          'reportes',
          'proveedores',
          'albaranes',
          'usuarios',
          'inventario',
          'ajustes',
          'app_shutdown',
        ],
        password: '123456', // ⚠️ En producción usar hash
        activo: true,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
      },
      {
        nombre: 'Carlos Administrador',
        email: 'admin@orionsystem.com',
        telefono: '+34 91 123 4567',
        rol: 'Administrador',
        permisos: [
          'dashboard',
          'productos',
          'categorias',
          'recetas',
          'ventas',
          'reportes',
          'proveedores',
          'albaranes',
          'usuarios',
          'inventario',
          'ajustes',
        ],
        password: '123456', // ⚠️ En producción usar hash
        activo: true,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
      },
      {
        nombre: 'María Gerente',
        email: 'gerente@orionsystem.com',
        telefono: '+34 91 234 5678',
        rol: 'Gerente',
        permisos: [
          'dashboard',
          'productos',
          'categorias',
          'recetas',
          'ventas',
          'reportes',
          'proveedores',
          'albaranes',
          'inventario',
        ],
        password: '123456',
        activo: true,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
      },
      {
        nombre: 'Juan Empleado',
        email: 'empleado@orionsystem.com',
        telefono: '+34 91 345 6789',
        rol: 'Empleado',
        permisos: ['dashboard', 'productos', 'ventas'],
        password: '123456',
        activo: true,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
      },
      {
        nombre: 'Ana Visualizador',
        email: 'visualizador@orionsystem.com',
        telefono: '+34 91 456 7890',
        rol: 'Visualizador',
        permisos: ['dashboard', 'reportes'],
        password: '123456',
        activo: true,
        fechaCreacion: new Date(),
        ultimoAcceso: new Date(),
      },
    ];

    try {
      let createdCount = 0;
      for (const user of defaultUsers) {
        // Verificar si este usuario específico ya existe
        const q = query(usuariosRef, where('email', '==', user.email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          await addDoc(usuariosRef, user);
          console.log(`Usuario creado: ${user.nombre}`);
          createdCount++;
        } else {
          console.log(`Usuario ya existe: ${user.nombre}`);
        }
      }

      if (createdCount > 0) {
        console.log(`${createdCount} usuarios de prueba creados exitosamente`);
      } else {
        console.log('Todos los usuarios de prueba ya existían');
      }
    } catch (error) {
      console.error('Error creando usuarios por defecto:', error);
      throw error;
    }
  }
}
