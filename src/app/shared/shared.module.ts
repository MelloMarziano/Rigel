import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MermaInfoComponent } from './components/merma-info/merma-info.component';
import { AppCurrencyPipe } from './pipes/app-currency.pipe';

@NgModule({
  declarations: [MermaInfoComponent, AppCurrencyPipe],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, MermaInfoComponent, AppCurrencyPipe],
})
export class SharedModule {}
