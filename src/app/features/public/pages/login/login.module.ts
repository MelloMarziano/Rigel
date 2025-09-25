import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { LoginPage } from './login.page';
import { LoginPageRoutingModule } from './login.page-routing.module';
import { PublicModule } from '../../public.module';

@NgModule({
  imports: [
    LoginPageRoutingModule,
    PublicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [LoginPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPageModule {}
