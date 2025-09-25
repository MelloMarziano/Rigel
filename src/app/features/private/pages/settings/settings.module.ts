import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SettingsPage } from './settings.page';
import { SettingsPageRoutingModule } from './settings.page-routing.module';

@NgModule({
  imports: [
    SettingsPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [SettingsPage],
})
export class SettingsPageModule {}
