import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AlbaranesPage } from './albaranes.page';
import { AlbaranesPageRoutingModule } from './albaranes.page-routing.module';

import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    AlbaranesPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [AlbaranesPage],
})
export class AlbaranesPageModule {}
