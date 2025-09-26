import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PersonalizacionSistema } from '../models/configuracion.model';
import {
  Firestore,
  collection,
  collectionData,
  query,
  limit,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class PersonalizacionService {
  private coloresDefecto: PersonalizacionSistema = {
    colorPrincipal: '#dc3545',
    colorSidebar: '#122d44',
    colorSidebarSecundario: '#6e120b',
    colorTextoSidebar: '#ffffff',
    colorHoverSidebar: '#34495e',
  };

  private personalizacionSubject = new BehaviorSubject<PersonalizacionSistema>(
    this.coloresDefecto
  );
  public personalizacion$ = this.personalizacionSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.aplicarColoresAlSistema(this.coloresDefecto);
    this.cargarPersonalizacionDesdeFirebase();
  }

  actualizarPersonalizacion(personalizacion: PersonalizacionSistema): void {
    this.personalizacionSubject.next(personalizacion);
    this.aplicarColoresAlSistema(personalizacion);
  }

  obtenerPersonalizacionActual(): PersonalizacionSistema {
    return this.personalizacionSubject.value;
  }

  private aplicarColoresAlSistema(colores: PersonalizacionSistema): void {
    const root = document.documentElement;

    // Variables CSS principales
    root.style.setProperty('--color-principal', colores.colorPrincipal);
    root.style.setProperty('--color-sidebar', colores.colorSidebar);
    root.style.setProperty(
      '--color-sidebar-secundario',
      colores.colorSidebarSecundario
    );
    root.style.setProperty('--color-texto-sidebar', colores.colorTextoSidebar);
    root.style.setProperty('--color-hover-sidebar', colores.colorHoverSidebar);

    // Variables derivadas para diferentes tonalidades
    root.style.setProperty(
      '--color-principal-hover',
      this.darkenColor(colores.colorPrincipal, 10)
    );
    root.style.setProperty(
      '--color-principal-light',
      this.lightenColor(colores.colorPrincipal, 20)
    );
    root.style.setProperty(
      '--color-sidebar-dark',
      this.darkenColor(colores.colorSidebar, 5)
    );
    root.style.setProperty(
      '--color-sidebar-light',
      this.lightenColor(colores.colorSidebar, 10)
    );

    // Crear degradado para el sidebar
    const gradientSidebar = `linear-gradient(to bottom, ${colores.colorSidebar}, ${colores.colorSidebarSecundario})`;
    root.style.setProperty('--color-sidebar-gradient', gradientSidebar);
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  resetearColores(): void {
    this.actualizarPersonalizacion(this.coloresDefecto);
  }

  private cargarPersonalizacionDesdeFirebase(): void {
    const personalizacionRef = collection(this.firestore, 'personalizacion');
    const q = query(personalizacionRef, limit(1));

    collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
      if (data.length > 0) {
        const personalizacion = data[0] as PersonalizacionSistema;
        this.actualizarPersonalizacion(personalizacion);
      }
    });
  }
}
