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
    modoOscuro: false,
  };

  private personalizacionSubject = new BehaviorSubject<PersonalizacionSistema>(
    this.coloresDefecto
  );
  public personalizacion$ = this.personalizacionSubject.asObservable();

  // Temas predefinidos
  private temasPredefindos = {
    default: {
      colorPrincipal: '#dc3545',
      colorSidebar: '#122d44',
      colorSidebarSecundario: '#6e120b',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#34495e',
      modoOscuro: false,
    },
    pink: {
      colorPrincipal: '#e91e63',
      colorSidebar: '#880e4f',
      colorSidebarSecundario: '#ad1457',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#c2185b',
      modoOscuro: false,
    },
    barbie: {
      colorPrincipal: '#ff69b4',
      colorSidebar: '#ff1493',
      colorSidebarSecundario: '#c71585',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#ff20b2',
      modoOscuro: false,
    },
    blue: {
      colorPrincipal: '#007bff',
      colorSidebar: '#0056b3',
      colorSidebarSecundario: '#004085',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#0069d9',
      modoOscuro: false,
    },
    green: {
      colorPrincipal: '#28a745',
      colorSidebar: '#1e7e34',
      colorSidebarSecundario: '#155724',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#218838',
      modoOscuro: false,
    },
    purple: {
      colorPrincipal: '#6f42c1',
      colorSidebar: '#5a32a3',
      colorSidebarSecundario: '#4c2a85',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#6610f2',
      modoOscuro: false,
    },
    orange: {
      colorPrincipal: '#fd7e14',
      colorSidebar: '#e55100',
      colorSidebarSecundario: '#bf360c',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#f57c00',
      modoOscuro: false,
    },
    teal: {
      colorPrincipal: '#20c997',
      colorSidebar: '#00695c',
      colorSidebarSecundario: '#004d40',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#00897b',
      modoOscuro: false,
    },
    indigo: {
      colorPrincipal: '#6610f2',
      colorSidebar: '#4e0d75',
      colorSidebarSecundario: '#3d0a5c',
      colorTextoSidebar: '#ffffff',
      colorHoverSidebar: '#5a23c8',
      modoOscuro: false,
    },
  };

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

  aplicarTema(nombreTema: keyof typeof this.temasPredefindos): PersonalizacionSistema {
    const tema = this.temasPredefindos[nombreTema];
    if (tema) {
      const personalizacionActual = this.obtenerPersonalizacionActual();
      const nuevaPersonalizacion = { ...tema, modoOscuro: personalizacionActual.modoOscuro };
      this.actualizarPersonalizacion(nuevaPersonalizacion);
      return nuevaPersonalizacion;
    }
    return this.obtenerPersonalizacionActual();
  }

  alternarModoOscuro(): void {
    const personalizacionActual = this.obtenerPersonalizacionActual();
    const nuevaPersonalizacion = {
      ...personalizacionActual,
      modoOscuro: !personalizacionActual.modoOscuro
    };
    this.actualizarPersonalizacion(nuevaPersonalizacion);
  }

  obtenerTemasDisponibles() {
    return Object.keys(this.temasPredefindos);
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

    // Aplicar modo oscuro
    this.aplicarModoOscuro(colores.modoOscuro || false);
  }

  private aplicarModoOscuro(modoOscuro: boolean): void {
    
    if (modoOscuro) {
      // Variables para modo oscuro
      document.documentElement.style.setProperty('--bg-body', '#121212');
      document.documentElement.style.setProperty('--bg-surface', '#1e1e1e');
      document.documentElement.style.setProperty('--bg-card', '#2d2d2d');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#b3b3b3');
      document.documentElement.style.setProperty('--text-muted', '#888888');
      document.documentElement.style.setProperty('--border-color', '#404040');
      document.documentElement.style.setProperty('--input-bg', '#2d2d2d');
      document.documentElement.style.setProperty('--input-border', '#404040');
      
      // Agregar clase dark-mode al body
      document.body.classList.add('dark-mode');
    } else {
      // Variables para modo claro (valores por defecto)
      document.documentElement.style.setProperty('--bg-body', '#f8f4e4');
      document.documentElement.style.setProperty('--bg-surface', '#f8f9fa');
      document.documentElement.style.setProperty('--bg-card', '#ffffff');
      document.documentElement.style.setProperty('--text-primary', '#212529');
      document.documentElement.style.setProperty('--text-secondary', '#6c757d');
      document.documentElement.style.setProperty('--text-muted', '#6c757d');
      document.documentElement.style.setProperty('--border-color', '#dee2e6');
      document.documentElement.style.setProperty('--input-bg', '#ffffff');
      document.documentElement.style.setProperty('--input-border', '#ced4da');
      
      // Remover clase dark-mode del body
      document.body.classList.remove('dark-mode');
    }
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
