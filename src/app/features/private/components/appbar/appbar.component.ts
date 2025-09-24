import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-appbar',
  templateUrl: './appbar.component.html',
  styleUrls: ['./appbar.component.scss'],
})
export class AppbarComponent {
  @Output() menuClick = new EventEmitter<void>();

  //private authService: AuthService
  constructor() {}
  // Método que se ejecuta cuando se hace clic en el botón
  toggleSidebar(): void {
    this.menuClick.emit();
  }

  logout() {
    // this.authService.logout();
  }
}
