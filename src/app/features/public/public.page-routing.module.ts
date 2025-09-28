import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PublicPage } from './public.page';
import { noAuthGuard } from 'src/app/core/guards/no-auth/no-auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PublicPage,
    children: [
      {
        path: 'sign-in',
        canActivate: [noAuthGuard],
        loadChildren: () =>
          import('./pages/login/login.module').then((m) => m.LoginPageModule),
      },
      {
        path: 'system-shutdown',
        // Sin noAuthGuard para permitir acceso a usuarios autenticados cuando el sistema está bloqueado
        loadChildren: () =>
          import('./pages/system-shutdown/system-shutdown.module').then(
            (m) => m.SystemShutdownPageModule
          ),
      },
      // {
      //   path: 'sign-up',
      //   loadChildren: () => import('./pages/sign-up/signup.module').then(m => m.SignUpPageModule)
      // },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
