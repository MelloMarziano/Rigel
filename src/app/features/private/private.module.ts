import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { PrivatePage } from './private.page';
import { CommonModule } from '@angular/common';
import { PrivateRoutingModule } from './private-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModuleCustom } from 'src/app/material/material.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppbarComponent } from './components/appbar/appbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import {
  LucideAngularModule,
  LayoutDashboard,
  Package,
  Tags,
  ChefHat,
  ShoppingCart,
  TrendingUp,
  Users,
  FileText,
  Sliders,
  Star,
  ShieldUser,
} from 'lucide-angular';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrivateRoutingModule,
    LucideAngularModule.pick({
      LayoutDashboard,
      Package,
      Tags,
      ChefHat,
      ShoppingCart,
      TrendingUp,
      Users,
      FileText,
      Sliders,
      Star,
      ShieldUser,
    }),
  ],
  declarations: [PrivatePage, AppbarComponent, SidebarComponent],
  exports: [CommonModule, ReactiveFormsModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrivateModule {}
