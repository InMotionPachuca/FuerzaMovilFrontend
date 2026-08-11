import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserDTO {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  password?: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<{ token: string; role?: string }> {
    return this.http.post<{ token: string; role?: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          sessionStorage.removeItem('jwt_token');
          sessionStorage.removeItem('user_role');
          
          sessionStorage.setItem('jwt_token', response.token);
          
          // Si el backend te devuelve el objeto del usuario o el rol, guárdalo.
          // Si no, decodificamos el JWT para extraer el rol asignado
          const payload = JSON.parse(atob(response.token.split('.')[1]));
          const roles: string[] = payload.roles || [];
          
          if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
            sessionStorage.setItem('user_role', 'ADMIN');
          } else {
            sessionStorage.setItem('user_role', 'AGENT');
          }
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('jwt_token');
  }

  getUserRole(): string | null {
    return sessionStorage.getItem('user_role');
  }

  logout(): void {
    sessionStorage.clear();
  }

  getUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.apiUrl}/users`);
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.getUsers();
  }

  registerUser(userData: RegisterRequest): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.apiUrl}/register`, userData);
  }

  getToken(): string | null {
    return sessionStorage.getItem('jwt_token');
  }
}