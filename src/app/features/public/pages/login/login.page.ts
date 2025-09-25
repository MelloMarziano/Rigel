import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { SeedService } from 'src/app/core/services/seed/seed.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  isCreatingUsers = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private seedService: SeedService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      try {
        const { email, password } = this.loginForm.value;
        const loggedIn = await this.authService.login(email, password);

        if (!loggedIn) {
          alert('Email o contraseña incorrectos, o usuario inactivo.');
        }
      } catch (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión. Intenta nuevamente.');
      } finally {
        this.isLoading = false;
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  async createTestUsers() {
    this.isCreatingUsers = true;
    try {
      await this.seedService.createDefaultUsers();
      alert(
        'Usuarios de prueba creados exitosamente. Ahora puedes iniciar sesión con cualquiera de ellos.'
      );
    } catch (error) {
      console.error('Error creando usuarios:', error);
      alert(
        'Error al crear usuarios de prueba. Revisa la consola para más detalles.'
      );
    } finally {
      this.isCreatingUsers = false;
    }
  }
}
