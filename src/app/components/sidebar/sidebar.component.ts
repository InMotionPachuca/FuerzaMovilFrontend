import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  userRoleDisplay: string = 'ADMIN';

  ngOnInit(): void {
    this.refreshUserRole();
  }

  private refreshUserRole(): void {
    const user = this.currentUser;
    if (user) {
      const rawRole = user.role || user.userRole || (user.roles && user.roles[0]) || 'ADMIN';
      this.userRoleDisplay = String(rawRole).replace('ROLE_', '').toUpperCase();
    }
  }

  get isAdmin(): boolean {
    const user = this.currentUser;
    if (!user) return false;
    const role = String(user.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'ROLE_ADMIN';
  }

  get currentUser(): any {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: 'Saldrás del sistema FuerzaMóvil - Toyota Pachuca',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      cancelButtonColor: '#222222',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.authService.logout();
        localStorage.clear();
        sessionStorage.clear();

        this.router.navigate(['/login']).then(() => {
          window.location.reload();
        });
      }
    });
  }
}