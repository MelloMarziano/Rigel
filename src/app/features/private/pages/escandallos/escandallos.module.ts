import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { EscandallosPage } from './escandallos.page';
import { EscandallosRoutingModule } from './escandallos.page-routing.module';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    EscandallosRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [EscandallosPage],
})
export class EscandallosPageModule {}
