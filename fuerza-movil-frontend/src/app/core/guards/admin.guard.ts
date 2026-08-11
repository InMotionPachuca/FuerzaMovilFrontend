import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = sessionStorage.getItem('jwt_token');
  const role = sessionStorage.getItem('user_role'); // Guardado tras el login

  if (token && role === 'ADMIN') {
    return true; // Acceso permitido
  }

  console.warn('Acceso denegado: Se requiere rol ADMIN');
  router.navigate(['/clients']);
  return false;
};