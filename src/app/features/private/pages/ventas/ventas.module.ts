import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { VentasPage } from './ventas.page';
import { VentasPageRoutingModule } from './ventas.page-routing.module';

@NgModule({
  imports: [
    VentasPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [VentasPage],
})
export class VentasPageModule {}
