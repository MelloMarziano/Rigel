import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModuleCustom } from 'src/app/material/material.module';
import { PublicRoutingModule } from './public.page-routing.module';
import { PublicPage } from './public.page';
import { 
  LucideAngularModule, 
  Star, 
  Power, 
  Info, 
  User, 
  Phone, 
  LogOut 
} from 'lucide-angular';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PublicRoutingModule,
    MaterialModuleCustom,
    LucideAngularModule.pick({
      Star,
      Power,
      Info,
      User,
      Phone,
      LogOut,
    }),
  ],
  declarations: [PublicPage],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModuleCustom,
    LucideAngularModule
  ],
})
export class PublicModule {}
