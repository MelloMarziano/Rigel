import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { FacturasPage } from './facturas.page';
import { FacturasPageRoutingModule } from './facturas.page-routing.module';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    FacturasPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [FacturasPage],
})
export class FacturasPageModule {}
