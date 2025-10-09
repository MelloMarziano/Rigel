import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MermasPage } from './mermas.page';
import { ReportesMermasComponent } from './reportes-mermas/reportes-mermas.component';

const routes: Routes = [
  {
    path: '',
    component: MermasPage,
  },
  {
    path: 'reportes',
    component: ReportesMermasComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MermasPageRoutingModule {}
