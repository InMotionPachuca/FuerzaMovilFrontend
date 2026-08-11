import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.getUserRole() === 'ADMIN') {
    return true;
  }

  console.warn('Acceso denegado: Se requiere rol ADMIN');
  router.navigate(['/clients']);
  return false;
};