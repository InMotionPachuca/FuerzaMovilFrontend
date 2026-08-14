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
  isTopAgent?: boolean;
  assignedClientsCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private http = inject(HttpClient);
  
  // Apunta a los controladores reales de Spring Boot
  private baseUrl = 'https://fuerzamovilbackend.onrender.com/api/v1';
  private agentsUrl = `${this.baseUrl}/agents`;
  private authUrl = `${this.baseUrl}/auth`;

  /**
   * Obtiene la lista de asesores comerciales (AgentController: GET /api/v1/agents)
   */
  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.agentsUrl);
  }

  /**
   * Registra un nuevo asesor/usuario (AuthController: POST /api/v1/auth/register)
   */
  createAgent(agent: Agent): Observable<Agent> {
    return this.http.post<Agent>(`${this.authUrl}/register`, agent);
  }

  /**
   * Actualiza los datos de un usuario (AuthController: PUT /api/v1/auth/users/{id})
   */
  updateAgent(id: number, agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.authUrl}/users/${id}`, agent);
  }

  /**
   * Elimina un usuario (AuthController: DELETE /api/v1/auth/users/{id})
   */
  deleteAgent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.authUrl}/users/${id}`);
  }

  /**
   * Alterna el estado de Top Agent (AgentController: PUT /api/v1/agents/{id}/toggle-top-agent)
   */
  toggleTopAgentStatus(id: number): Observable<any> {
    return this.http.put<any>(`${this.agentsUrl}/${id}/toggle-top-agent`, {});
  }
}