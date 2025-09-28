import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivatePage } from './private.page';
import { roleGuard } from 'src/app/core/guards/role/role.guard';
import { ConfigGuard } from 'src/app/core/guards/config/config.guard';
import { appShutdownGuard } from 'src/app/core/guards/app-shutdown/app-shutdown.guard';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PrivatePage,
    children: [
      {
        path: 'dashboard',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['dashboard'] },
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule
          ),
      },
      {
        path: 'proveedores',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['proveedores'] },
        loadChildren: () =>
          import('./pages/proveedores/proveedores.module').then(
            (m) => m.ProveedoresPageModule
          ),
      },
      {
        path: 'categoria',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['categorias'] },
        loadChildren: () =>
          import('./pages/categoria/categoria.module').then(
            (m) => m.CategoriaPageModule
          ),
      },
      {
        path: 'productos',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['productos'] },
        loadChildren: () =>
          import('./pages/productos/productos.module').then(
            (m) => m.ProductosPageModule
          ),
      },
      {
        path: 'usuarios',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['usuarios'] },
        loadChildren: () =>
          import('./pages/usuarios/usuarios.module').then(
            (m) => m.UsuariosPageModule
          ),
      },
      // Rutas adicionales para completar el sidebar
      {
        path: 'recetas',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['recetas'] },
        loadChildren: () =>
          import('./pages/recetas/recetas.module').then(
            (m) => m.RecetasPageModule
          ),
      },
      {
        path: 'ventas',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['ventas'] },
        loadChildren: () =>
          import('./pages/ventas/ventas.module').then(
            (m) => m.VentasPageModule
          ),
      },
      {
        path: 'reportes',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['reportes'] },
        loadChildren: () =>
          import('./pages/reportes/reportes.module').then(
            (m) => m.ReportesPageModule
          ),
      },
      {
        path: 'facturas',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['facturas'] },
        loadChildren: () =>
          import('./pages/facturas/facturas.module').then(
            (m) => m.FacturasPageModule
          ),
      },
      {
        path: 'albaranes',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['albaranes'] },
        loadChildren: () =>
          import('./pages/albaranes/albaranes.module').then(
            (m) => m.AlbaranesPageModule
          ),
      },

      {
        path: 'inventario',
        canActivate: [appShutdownGuard, ConfigGuard, roleGuard],
        data: { permissions: ['inventario'] },
        loadChildren: () =>
          import('./pages/inventario/inventario.module').then(
            (m) => m.InventarioPageModule
          ),
      },
      {
        path: 'ajustes',
        canActivate: [appShutdownGuard, roleGuard],
        data: { permissions: ['ajustes'] },
        loadChildren: () =>
          import('./pages/settings/settings.module').then(
            (m) => m.SettingsPageModule
          ),
      },
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
