import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductosPage } from './productos.page';
import { ProductosPageRoutingModule } from './productos.page-routing.module';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProductosPageRoutingModule,
    SharedModule,
  ],
  declarations: [ProductosPage],
})
export class ProductosPageModule {}
