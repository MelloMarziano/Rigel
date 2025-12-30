import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { InventarioPage } from './inventario.page';
import { InventarioPageRoutingModule } from './inventario.page-routing.module';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    InventarioPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [InventarioPage],
})
export class InventarioPageModule {}
