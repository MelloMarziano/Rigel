import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MermasPage } from './mermas.page';
import { MermasPageRoutingModule } from './mermas.page-routing.module';
import { ReportesMermasComponent } from './reportes-mermas/reportes-mermas.component';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    MermasPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [MermasPage, ReportesMermasComponent],
})
export class MermasPageModule {}
