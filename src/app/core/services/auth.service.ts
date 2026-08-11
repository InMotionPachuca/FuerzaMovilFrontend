import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserDTO {
  id?: number;
  fullName?: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('jwt_token', response.token);
          
          const userObj: UserDTO = {
            id: response.id || response.userId,
            fullName: response.fullName,
            username: credentials.username,
            role: response.role
          };

          localStorage.setItem('user', JSON.stringify(userObj));
          localStorage.setItem('user_role', response.role);
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') || !!localStorage.getItem('jwt_token');
  }

  getCurrentUser(): UserDTO | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserDTO;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getUsername(): string {
    const user = this.getCurrentUser();
    return user ? (user.username || '') : '';
  }

  getUserRole(): string | null {
    const directRole = localStorage.getItem('user_role');
    if (directRole) return directRole;

    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.apiUrl}/users`);
  }

  registerUser(user: any): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.apiUrl}/register`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
}