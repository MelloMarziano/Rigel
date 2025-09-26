import { Component, OnInit } from '@angular/core';
import { PersonalizacionService } from './core/services/personalizacion.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Rigel';

  constructor(private personalizacionService: PersonalizacionService) {}

  ngOnInit(): void {
    // El servicio se inicializa automáticamente y aplica los colores por defecto
  }
}
