import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SystemShutdownPage } from './system-shutdown.page';
import { PublicModule } from '../../public.module';
import { SystemShutdownPageRoutingModule } from './system-shutdown.page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SystemShutdownPageRoutingModule,
    PublicModule,
  ],
  declarations: [SystemShutdownPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SystemShutdownPageModule {}
