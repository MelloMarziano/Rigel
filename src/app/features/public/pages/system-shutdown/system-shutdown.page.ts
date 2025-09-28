import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-system-shutdown',
  templateUrl: './system-shutdown.page.html',
  styleUrls: ['./system-shutdown.page.scss']
})
export class SystemShutdownPage implements OnInit {
  
  supportContact = {
    name: 'Alberto Ortega',
    title: 'CTO - Soporte Técnico',
    phone: '+34 673 90 59 91',
    country: 'España',
    flag: '🇪🇸'
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Verificar si el usuario es ROOT, en cuyo caso redirigir al dashboard
    if (this.authService.hasPermission('app_shutdown')) {
      this.router.navigate(['/private/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  callSupport(): void {
    window.open(`tel:${this.supportContact.phone}`, '_self');
  }
}