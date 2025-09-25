import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-access-denied',
  template: `
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="text-center mt-5">
            <div class="mb-4">
              <i
                class="bi bi-shield-exclamation text-danger"
                style="font-size: 4rem;"
              ></i>
            </div>
            <h2 class="text-danger mb-3">Acceso Denegado</h2>
            <p class="text-muted mb-4">
              No tienes permisos suficientes para acceder a esta sección.
            </p>
            <div class="mb-4">
              <p class="small text-muted">
                <strong>Tu rol actual:</strong>
                {{ currentUser?.rol || 'Sin rol' }}
              </p>
            </div>
            <button class="btn btn-danger" (click)="goToDashboard()">
              <i class="bi bi-house me-2"></i>
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container-fluid {
        min-height: 80vh;
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class AccessDeniedComponent {
  constructor(private authService: AuthService, private router: Router) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  goToDashboard() {
    this.router.navigate(['/private/dashboard']);
  }
}
