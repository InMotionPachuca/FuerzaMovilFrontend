import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Agent {
  id?: number;
  fullName: string;
  username: string;
  password?: string;
  role: string;
  assignedClientsCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private http = inject(HttpClient);
  private authUrl = `${environment.apiUrl}/auth`;

  // Obtiene los usuarios reales (Admins y Agentes)
  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.authUrl}/users`);
  }

  // Registra un nuevo usuario
  createAgent(agent: Agent): Observable<Agent> {
    return this.http.post<Agent>(`${this.authUrl}/register`, agent);
  }

  // Actualiza nombre, usuario o rol en la BD
  updateAgent(id: number, agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.authUrl}/users/${id}`, agent);
  }

  // Elimina cualquier usuario de la BD limpiando la relación de clientes
  deleteAgent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.authUrl}/users/${id}`);
  }
}