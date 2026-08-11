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

  credentials = {
    username: '',
    password: ''
  };

  returnUrl: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        const role = res?.role || (this.credentials.username.includes('admin') ? 'ADMIN' : 'AGENT');
        const userObj = {
          id: res?.id || 1,
          fullName: res?.fullName || this.credentials.username,
          username: this.credentials.username,
          role: role
        };

        // Guardar estado de sesión en localStorage/sessionStorage
        localStorage.setItem('user', JSON.stringify(userObj));
        sessionStorage.setItem('user', JSON.stringify(userObj));

        // Redirección inteligente según el rol si no había ruta previa guardada
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (role === 'ADMIN') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/agent-dashboard']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidas o error de conexión con el servidor.';
        console.error('Error en el login:', err);
      }
    });
  }
}