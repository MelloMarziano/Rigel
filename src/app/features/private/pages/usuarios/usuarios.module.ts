import { NgModule } from '@angular/core';
import { PrivateModule } from '../../private.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UsuariosPage } from './usuarios.page';
import { UsuariosPageRoutingModule } from './usuarios.page-routing.module';

@NgModule({
  imports: [
    UsuariosPageRoutingModule,
    PrivateModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [UsuariosPage],
})
export class UsuariosPageModule {}
