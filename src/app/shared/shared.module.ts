import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MermaInfoComponent } from './components/merma-info/merma-info.component';

@NgModule({
  declarations: [MermaInfoComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, MermaInfoComponent],
})
export class SharedModule {}
