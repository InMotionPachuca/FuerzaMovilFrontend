import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  
  // Base URLs según tus controladores de Spring Boot
  private baseUrl = 'https://fuerzamovilbackend.onrender.com/api/v1';
  private clientsUrl = `${this.baseUrl}/clients`;
  private agentsUrl = `${this.baseUrl}/agents`;
  private authUrl = `${this.baseUrl}/auth`;

  /**
   * 1. Consulta paginada unificada (ClientController: GET /api/v1/clients/paged)
   */
  getClientsPaged(
    clientType: string = 'ALL',
    assignmentStatus: string = 'UNASSIGNED',
    page: number = 0,
    size: number = 10,
    userId?: number,
    userRole: string = 'ADMIN',
    search: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('clientType', clientType || 'ALL')
      .set('assignmentStatus', assignmentStatus || '')
      .set('search', search ? search.trim() : '')
      .set('page', page.toString())
      .set('size', size.toString())
      .set('userRole', userRole || 'ADMIN');

    if (userId !== undefined && userId !== null) {
      params = params.set('userId', userId.toString());
    }

    return this.http.get<any>(`${this.clientsUrl}/paged`, { params });
  }

  /**
   * 2. Métricas de resumen (ClientController: GET /api/v1/clients/metrics/summary)
   */
  getSummaryMetrics(): Observable<any> {
    return this.http.get<any>(`${this.clientsUrl}/metrics/summary`);
  }

  /**
   * 3. Listado de asesores (AgentController: GET /api/v1/agents)
   */
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(this.agentsUrl);
  }

  /**
   * 4. Listado completo de usuarios del sistema (AuthController: GET /api/v1/auth/users)
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.authUrl}/users`);
  }

  /**
   * 5. Asignar cliente individual a un asesor (ClientController: PUT /api/v1/clients/{clientId}/assign/{userId})
   */
  assignClientToUser(clientId: number, userId: number, actorName: string = 'Administrador Principal'): Observable<any> {
    const params = new HttpParams().set('actorName', actorName);
    return this.http.put<any>(`${this.clientsUrl}/${clientId}/assign/${userId}`, null, { params });
  }

  /**
   * 6. Desasignar / Liberar cliente (ClientController: PUT /api/v1/clients/{clientId}/unassign)
   */
  unassignClient(clientId: number, actorName: string = 'Administrador Principal'): Observable<any> {
    const params = new HttpParams().set('actorName', actorName);
    return this.http.put<any>(`${this.clientsUrl}/${clientId}/unassign`, null, { params });
  }

  /**
   * 7. Asignación por lote a un asesor (ClientController: POST /api/v1/clients/assign-batch/{userId}?count=...)
   */
  assignBatchToAgent(agentId: number | string, count: number, actorName: string = 'Administrador Principal'): Observable<any> {
    const params = new HttpParams()
      .set('count', count.toString())
      .set('actorName', actorName);
    return this.http.post<any>(`${this.clientsUrl}/assign-batch/${agentId}`, null, { params });
  }

  /**
   * 8. Auto-distribución equitativa (ClientController: POST /api/v1/clients/auto-distribute?countPerAgent=...)
   */
  autoDistributeClients(countPerAgent: number = 10, actorName: string = 'Administrador Principal'): Observable<any> {
    const params = new HttpParams()
      .set('countPerAgent', countPerAgent.toString())
      .set('actorName', actorName);
    return this.http.post<any>(`${this.clientsUrl}/auto-distribute`, null, { params });
  }

  /**
   * 9. Alternar estatus Top Agent (AgentController: PUT /api/v1/agents/{id}/toggle-top-agent)
   */
  toggleTopAgentStatus(agentId: number | string): Observable<any> {
    return this.http.put<any>(`${this.agentsUrl}/${agentId}/toggle-top-agent`, {});
  }

  /**
   * 10. Carga e importación de archivo Excel (ClientController: POST /api/v1/clients/import-excel)
   */
  uploadExcel(file: File, actorName: string = 'Administrador Principal'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('actorName', actorName);
    return this.http.post<any>(`${this.clientsUrl}/import-excel`, formData, { params });
  }

  /**
   * 11. Historial de auditoría por cliente (ClientController: GET /api/v1/clients/{clientId}/audit-logs)
   */
  getClientAuditLogs(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.clientsUrl}/${clientId}/audit-logs`);
  }

  /**
   * 12. Historial de seguimientos por asesor (ClientController: GET /api/v1/clients/follow-ups/agent/{agentId})
   */
  getFollowUpsByAgent(agentId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.clientsUrl}/follow-ups/agent/${agentId}`);
  }

  /**
   * 13. Guardar registro de seguimiento (ClientController: POST /api/v1/clients/{clientId}/follow-ups)
   */
  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.clientsUrl}/${clientId}/follow-ups`, payload);
  }

  /**
   * 14. Eliminar cliente (ClientController: DELETE /api/v1/clients/{id})
   */
  deleteClient(clientId: number): Observable<any> {
    return this.http.delete<any>(`${this.clientsUrl}/${clientId}`);
  }
}