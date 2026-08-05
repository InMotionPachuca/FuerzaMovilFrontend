import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Soluciona: Property 'credentials' does not exist on type 'LoginComponent'
  credentials = {
    username: '',
    password: ''
  };

  returnUrl: string = '/clients';
  errorMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    // Captura la URL a la que intentó acceder el usuario antes del guard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/clients';
  }

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirige a la pantalla solicitada originalmente o a /clients
        this.router.navigateByUrl(this.returnUrl);
      },
      // Soluciona: Object is of type 'unknown' dando tipo explícito (err: any)
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas o error de conexión.';
        console.error('Error en el login:', err);
      }
    });
  }
}