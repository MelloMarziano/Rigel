import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ReportesPage } from './reportes.page';
import { ReportesPageRoutingModule } from './reportes.page-routing.module';

@NgModule({
  imports: [
    ReportesPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [ReportesPage],
})
export class ReportesPageModule {}
