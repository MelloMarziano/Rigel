import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AlbaranesPage } from './albaranes.page';

const routes: Routes = [
  {
    path: '',
    component: AlbaranesPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AlbaranesPageRoutingModule {}
