import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SidebarService } from '../services/sidebar.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconService } from 'src/app/core/services/icons/icons.service';
export interface SidebarMenuItem {
  name: string;
  icon: string;
  route: string;
  iconColor: string;
  roles?: string[]; // Añadido para control de acceso por rol
}

export interface SidebarMenuSection {
  title: string;
  items: SidebarMenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  yearActual = new Date().getFullYear();
  sidebarMenu: SidebarMenuItem[] = [
    {
      name: 'Dashboard',
      icon: 'layout-dashboard',
      iconColor: '#ffffff',
      route: '/dashboard',
      // roles: ['admin', 'editor', 'normal'],
    },
    {
      name: 'Productos',
      icon: 'package',
      iconColor: '#ffffff',
      route: '/productos',
      // roles: ['admin', 'editor', 'normal'],
    },
    {
      name: 'Categorías',
      icon: 'tags',
      iconColor: '#ffffff',
      route: '/categoria',
      // roles: ['admin', 'editor', 'normal'],
    },
    {
      name: 'Recetas',
      icon: 'chef-hat',
      iconColor: '#ffffff',
      route: '/users',
      // roles: ['admin'], // Solo administradores pueden ver esta opción
    },
    {
      name: 'Ventas',
      icon: 'shopping-cart',
      iconColor: '#ffffff',
      route: '/users',
      // roles: ['admin'], // Solo administradores pueden ver esta opción
    },
    {
      name: 'Reportes',
      icon: 'trending-up',
      iconColor: '#ffffff',
      route: '/users',
      // roles: ['admin'], // Solo administradores pueden ver esta opción
    },
    {
      name: 'Proveedores',
      icon: 'users',
      iconColor: '#ffffff',
      route: '/proveedores',
      // roles: ['admin'], // Solo administradores pueden ver esta opción
    },
    {
      name: 'Albaranes',
      icon: 'file-text',
      iconColor: '#ffffff',
      route: '/users',
      // roles: ['admin'], // Solo administradores pueden ver esta opción
    },
    {
      name: 'Usuarios',
      icon: 'ShieldUser',
      iconColor: '#38bdf8',
      route: '/usuarios',
      // roles: ['admin', 'editor', 'normal'],
    },
    {
      name: 'Ajustes',
      icon: 'sliders',
      iconColor: '#38bdf8',
      route: '/settings',
      // roles: ['admin', 'editor', 'normal'],
    },
  ];

  currentRoute = '';

  userRole = localStorage.getItem('role') || '';

  get filteredSidebarMenu(): SidebarMenuItem[] {
    return this.sidebarMenu.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(this.userRole);
    });
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects.replace('/private', '');
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
          // Assuming 768px is the breakpoint for mobile
          this.sidebarService.toggleSidebar(false);
        }
      }
    });
  }

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private iconService: IconService,
    private sanitizer: DomSanitizer
  ) {}

  // Método para verificar si una ruta está activa
  isRouteActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  closeSidebar(): void {
    if (window.innerWidth < 768) {
      // Only close on mobile
      this.sidebarService.toggleSidebar(false);
    }
  }

  getSanitizedIcon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      this.iconService.getIcon(name)
    );
  }
}
