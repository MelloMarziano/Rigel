import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SidebarService } from '../services/sidebar.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconService } from 'src/app/core/services/icons/icons.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';

export interface SidebarMenuItem {
  name: string;
  icon: string;
  route: string;
  iconColor: string;
  permission: string; // Permiso requerido para ver esta opción
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
  private _filteredMenu: SidebarMenuItem[] | null = null;

  sidebarMenu: SidebarMenuItem[] = [
    {
      name: 'Dashboard',
      icon: 'layout-dashboard',
      iconColor: '#ffffff',
      route: '/dashboard',
      permission: 'dashboard',
    },
    {
      name: 'Productos',
      icon: 'package',
      iconColor: '#ffffff',
      route: '/productos',
      permission: 'productos',
    },
    {
      name: 'Categorías',
      icon: 'tags',
      iconColor: '#ffffff',
      route: '/categoria',
      permission: 'categorias',
    },
    {
      name: 'Recetas',
      icon: 'chef-hat',
      iconColor: '#ffffff',
      route: '/recetas',
      permission: 'recetas',
    },
    {
      name: 'Escandallos',
      icon: 'Calculator',
      iconColor: '#ffffff',
      route: '/escandallos',
      permission: 'escandallos',
    },
    {
      name: 'Mermas',
      icon: 'TriangleAlert',
      iconColor: '#ffffff',
      route: '/mermas',
      permission: 'mermas',
    },
    {
      name: 'POS',
      icon: 'CreditCard',
      iconColor: '#ffffff',
      route: '/ventas',
      permission: 'ventas',
    },
    {
      name: 'Reportes',
      icon: 'trending-up',
      iconColor: '#ffffff',
      route: '/reportes',
      permission: 'reportes',
    },
    {
      name: 'Proveedores',
      icon: 'users',
      iconColor: '#ffffff',
      route: '/proveedores',
      permission: 'proveedores',
    },
    {
      name: 'Albaranes',
      icon: 'file-text',
      iconColor: '#ffffff',
      route: '/albaranes',
      permission: 'albaranes',
    },
    {
      name: 'Facturas',
      icon: 'receipt-euro',
      iconColor: '#ffffff',
      route: '/facturas',
      permission: 'facturas',
    },
    {
      name: 'Usuarios',
      icon: 'ShieldUser',
      iconColor: '#38bdf8',
      route: '/usuarios',
      permission: 'usuarios',
    },
    {
      name: 'Inventario',
      icon: 'PackageSearch',
      iconColor: '#38bdf8',
      route: '/inventario',
      permission: 'inventario',
    },
  ];

  currentRoute = '';

  get filteredSidebarMenu(): SidebarMenuItem[] {
    // Cache el resultado para evitar filtrado excesivo
    if (this._filteredMenu === null) {
      this._filteredMenu = this.sidebarMenu.filter((item) => {
        return this.authService.hasPermission(item.permission);
      });
    }
    return this._filteredMenu;
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
    private sanitizer: DomSanitizer,
    private authService: AuthService
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
