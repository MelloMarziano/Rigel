import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemShutdownPage } from './system-shutdown.page';

const routes: Routes = [
  {
    path: '',
    component: SystemShutdownPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SystemShutdownPageRoutingModule {}