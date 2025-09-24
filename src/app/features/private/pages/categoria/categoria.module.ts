import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CategoriaPage } from './categoria.page';
import { CategoriaPageRoutingModule } from './categoria.page-routing.module';

@NgModule({
  imports: [
    CategoriaPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [CategoriaPage],
})
export class CategoriaPageModule {}
