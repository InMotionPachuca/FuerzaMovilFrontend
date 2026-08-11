import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  public authService = inject(AuthService);

  get currentUser(): any {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
  }
}