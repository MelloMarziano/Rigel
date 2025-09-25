import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { RecetasPage } from './recetas.page';
import { RecetasPageRoutingModule } from './recetas.page-routing.module';

@NgModule({
  imports: [
    RecetasPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [RecetasPage],
})
export class RecetasPageModule {}
