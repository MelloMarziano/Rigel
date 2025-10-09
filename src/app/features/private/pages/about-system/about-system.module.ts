import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AboutSystemPage } from './about-system.page';

const routes: Routes = [
  {
    path: '',
    component: AboutSystemPage,
  },
];

@NgModule({
  declarations: [AboutSystemPage],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class AboutSystemModule {}
