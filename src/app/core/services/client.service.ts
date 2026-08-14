import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'https://fuerzamovilbackend.onrender.com/api/v1/clients';
  private usersUrl = 'https://fuerzamovilbackend.onrender.com/api/v1/users';

  // 1. Consulta paginada unificada
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

    return this.http.get<any>(`${this.apiUrl}/paged`, { params });
  }

  // 2. Métricas globales
  getSummaryMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/summary`);
  }

  // 3. Listado de asesores
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(this.usersUrl);
  }

  // 4. Asignación individual
  assignClientToUser(clientId: number, userId: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/assign`, { userId, actorName });
  }

  // 5. Asignación por lote a un asesor específico (Resuelve TS2339 en admin-analytics)
  assignBatchToAgent(agentId: number | string, baseCount: number, actorName: string = 'Administrador Principal'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign/daily-batch`, { userId: agentId, baseCount, actorName });
  }

  // 6. Auto distribución masiva entre todos los agentes (Resuelve TS2339 en agent-list y admin-dashboard)
  autoDistributeClients(countPerAgent: number = 10, actorName: string = 'Administrador Principal'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auto-distribute`, { countPerAgent, actorName });
  }

  // 7. Liberar/Desasignar cliente
  unassignClient(clientId: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/unassign`, { actorName });
  }

  // 8. Carga de archivo Excel
  uploadExcel(file: File, actorName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/import/excel`, formData);
  }

  // 9. Historial de auditoría por cliente
  getClientAuditLogs(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/audit-logs`);
  }

  // 10. Seguimientos y avances por asesor (Resuelve TS2339 en admin-analytics y agent-dashboard)
  getFollowUpsByAgent(agentId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/follow-ups/agent/${agentId}`);
  }

  // 11. Registrar nuevo seguimiento
  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/follow-ups`, payload);
  }

  // 12. Alternar estado Top Agent (Resuelve TS2339 en top-agents)
  toggleTopAgentStatus(agentId: number | string): Observable<any> {
    return this.http.patch<any>(`${this.usersUrl}/${agentId}/toggle-top-status`, {});
  }

  // 13. Eliminar cliente
  deleteClient(clientId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clientId}`);
  }
}