import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // 401: Token realmente expirado -> Redirigir a Login
      if (error.status === 401) {
        console.warn('Sesión expirada (401). Redirigiendo a Login...');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        router.navigate(['/login']);
      }

      // 403: Permisos insuficientes para el recurso
      if (error.status === 403) {
        console.error('Error 403 (Forbidden): El token es válido pero no posee permisos para esta ruta.');
      }

      const errorMessage = error.error?.message || error.statusText || 'Error de conexión con el servidor';
      console.error(`HTTP Error [${error.status}]:`, errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};