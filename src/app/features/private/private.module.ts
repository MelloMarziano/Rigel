import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { PrivatePage } from './private.page';
import { CommonModule } from '@angular/common';
import { PrivateRoutingModule } from './private-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppbarComponent } from './components/appbar/appbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';

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
  Settings,
  Star,
  ShieldUser,
  PackageSearch,
  ReceiptEuro,
  TriangleAlert,
  Calculator,
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
      Settings,
      Star,
      ShieldUser,
      PackageSearch,
      ReceiptEuro,
      TriangleAlert,
      Calculator,
    }),
  ],
  declarations: [
    PrivatePage,
    AppbarComponent,
    SidebarComponent,
    AccessDeniedComponent,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrivateRoutingModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrivateModule {}
