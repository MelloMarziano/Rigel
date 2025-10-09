import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EscandallosPage } from './escandallos.page';

const routes: Routes = [
  {
    path: '',
    component: EscandallosPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EscandallosRoutingModule {}
