import { UsuariosPageModule } from './pages/usuarios/usuarios.module';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivatePage } from './private.page';
import { roleGuard } from 'src/app/core/guards/role/role.guard';
// import { RoleGuard } from 'src/app/core/guards/role/role.guard';

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
        // canActivate: [roleGuard],
        // data: { roles: ['Admin', 'User'] },
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule
          ),
      },
      {
        path: 'proveedores',
        // canActivate: [roleGuard],
        // data: { roles: ['Admin', 'User'] },
        loadChildren: () =>
          import('./pages/proveedores/proveedores.module').then(
            (m) => m.ProveedoresPageModule
          ),
      },
      {
        path: 'categoria',
        // canActivate: [roleGuard],
        // data: { roles: ['Admin', 'User'] },
        loadChildren: () =>
          import('./pages/categoria/categoria.module').then(
            (m) => m.CategoriaPageModule
          ),
      },
      {
        path: 'productos',
        // canActivate: [roleGuard],
        // data: { roles: ['Admin', 'User'] },
        loadChildren: () =>
          import('./pages/productos/productos.module').then(
            (m) => m.ProductosPageModule
          ),
      },
      {
        path: 'usuarios',
        // canActivate: [roleGuard],
        // data: { roles: ['Admin', 'User'] },
        loadChildren: () =>
          import('./pages/usuarios/usuarios.module').then(
            (m) => m.UsuariosPageModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
