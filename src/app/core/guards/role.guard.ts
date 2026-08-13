import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const expectedRole = String(route.data?.['expectedRole'] || '').toUpperCase().replace('ROLE_', '');
  const userRole = String(authService.getUserRole() || '').toUpperCase().replace('ROLE_', '');

  if (userRole === expectedRole) {
    return true;
  }

  console.warn(`[roleGuard] Acceso denegado a ${state.url}: Se requiere ${expectedRole} (Actual: ${userRole})`);
  router.navigate(['/clients']);
  return false;
};