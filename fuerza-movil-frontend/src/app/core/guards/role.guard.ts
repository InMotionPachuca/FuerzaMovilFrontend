import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userRole = sessionStorage.getItem('user_role');
  const expectedRole = route.data?.['expectedRole'];

  // Validación estricta
  if (userRole && userRole === expectedRole) {
    return true;
  }

  // Redirección forzada si intenta acceder sin ser ADMIN
  router.navigate(['/clients']);
  return false;
};