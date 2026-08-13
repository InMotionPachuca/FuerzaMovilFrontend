import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Limpiamos el rol para tolerar "ADMIN" o "ROLE_ADMIN"
  const rawRole = String(authService.getUserRole() || '').toUpperCase().replace('ROLE_', '');

  if (rawRole === 'ADMIN') {
    return true;
  }

  console.warn(`[adminGuard] Acceso denegado a ${state.url} para el usuario.`);
  router.navigate(['/clients']);
  return false;
};