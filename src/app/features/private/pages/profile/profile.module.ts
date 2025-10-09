import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfilePage } from './profile.page';

const routes: Routes = [
  {
    path: '',
    component: ProfilePage,
  },
];

@NgModule({
  declarations: [ProfilePage],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class ProfileModule {}
