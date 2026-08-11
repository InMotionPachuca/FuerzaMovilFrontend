import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data?.['expectedRole'];
  const userRole = authService.getUserRole();

  if (authService.isLoggedIn() && userRole === expectedRole) {
    return true;
  }

  console.warn(`Acceso denegado a ${state.url}: Se requiere rol ${expectedRole} (Rol actual: ${userRole})`);
  router.navigate(['/clients']);
  return false;
};