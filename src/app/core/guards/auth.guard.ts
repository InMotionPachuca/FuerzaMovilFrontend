import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guarda la URL a la que intentaba acceder para redirigir tras el login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};