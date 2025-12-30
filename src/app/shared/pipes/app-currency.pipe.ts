import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ConfiguracionService } from '../../core/services/configuracion.service';

@Pipe({
  name: 'appCurrency',
  pure: false
})
export class AppCurrencyPipe implements PipeTransform {

  constructor(
    private configService: ConfiguracionService
  ) {}

  transform(
    value: number | string | null | undefined,
    display: string | boolean = 'symbol',
    digitsInfo: string = '1.2-2',
    locale: string = 'es-ES'
  ): string | null {
    if (value === null || value === undefined) return null;

    const config = this.configService.getConfiguracionActual();
    const currencyCode = config?.moneda || 'EUR';
    
    // Instanciamos CurrencyPipe bajo demanda o podríamos inyectarlo si lo proveemos.
    // Instanciarlo aquí es seguro y simple.
    const currencyPipe = new CurrencyPipe(locale);
    
    return currencyPipe.transform(value, currencyCode, display, digitsInfo);
  }
}
