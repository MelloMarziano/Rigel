import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MermasPage } from './mermas.page';
import { MermasPageRoutingModule } from './mermas.page-routing.module';
import { ReportesMermasComponent } from './reportes-mermas/reportes-mermas.component';

@NgModule({
  imports: [
    MermasPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [MermasPage, ReportesMermasComponent],
})
export class MermasPageModule {}
