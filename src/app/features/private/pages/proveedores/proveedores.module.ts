import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ProveedoresPage } from './proveedores.page';
import { ProveedoresPageRoutingModule } from './proveedores.page-routing.module';

@NgModule({
  imports: [
    ProveedoresPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [ProveedoresPage],
})
export class ProveedoresPageModule {}
