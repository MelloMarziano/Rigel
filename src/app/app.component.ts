import { Component, OnInit } from '@angular/core';
import { PersonalizacionService } from './core/services/personalizacion.service';
import { AuthService } from './core/services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Rigel';

  constructor(
    private personalizacionService: PersonalizacionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar personalización del usuario si está autenticado
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      this.personalizacionService.cargarPersonalizacionUsuario(user.id);
    } else {
      this.personalizacionService.resetearADefecto();
    }
  }
}
