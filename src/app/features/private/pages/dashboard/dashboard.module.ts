import { NgModule } from "@angular/core";
import { PrivateModule } from "../../private.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';

import { DashboardPage } from "./dashboard.page";
import { DashboardPageRoutingModule } from "./dashboard.page-routing.module";




@NgModule({
  imports: [
    DashboardPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [
    DashboardPage,
  ],

})

export class DashboardPageModule { }
