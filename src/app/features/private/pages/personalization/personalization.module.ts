import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { PersonalizationPage } from './personalization.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalizationPage,
  },
];

@NgModule({
  declarations: [PersonalizationPage],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class PersonalizationModule {}
