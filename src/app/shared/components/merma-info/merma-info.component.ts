import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MermasService, Merma } from '../../../core/services/mermas.service';

@Component({
  selector: 'app-merma-info',
  templateUrl: './merma-info.component.html',
  styleUrls: ['./merma-info.component.scss'],
})
export class MermaInfoComponent implements OnInit, OnChanges {
  @Input() productoId!: string;
  @Input() cantidad: number = 0;
  @Input() unidadMedida: string = 'unidades';
  @Input() mostrarDetalle: boolean = true;

  merma: Merma | null = null;
  cantidadUtil: number = 0;
  perdida: number = 0;

  constructor(private mermasService: MermasService) {}

  ngOnInit(): void {
    if (this.productoId) {
      this.cargarMerma();
    }
  }

  private cargarMerma(): void {
    this.mermasService
      .getMermaPorProducto(this.productoId)
      .subscribe((merma) => {
        this.merma = merma || null;
        this.calcular();
      });
  }

  private calcular(): void {
    if (this.merma && this.cantidad > 0) {
      this.cantidadUtil = this.mermasService.calcularCantidadUtil(
        this.cantidad,
        this.merma.porcentajeMerma
      );
      this.perdida = this.mermasService.calcularPerdida(
        this.cantidad,
        this.merma.porcentajeMerma
      );
    } else {
      this.cantidadUtil = this.cantidad;
      this.perdida = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cantidad'] || changes['productoId']) {
      this.calcular();
    }
  }
}
