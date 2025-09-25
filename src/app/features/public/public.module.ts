import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModuleCustom } from 'src/app/material/material.module';
import { PublicRoutingModule } from './public.page-routing.module';
import { PublicPage } from './public.page';
import { LucideAngularModule, Star } from 'lucide-angular';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PublicRoutingModule,
    MaterialModuleCustom,
    LucideAngularModule.pick({
      Star,
    }),
  ],
  declarations: [PublicPage],
  exports: [],
})
export class PublicModule {}
