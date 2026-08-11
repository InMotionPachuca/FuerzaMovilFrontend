import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLogDTO {
  id: number;
  action: string;
  description: string;
  actorName: string;
  batchName: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/clients';
  private agentsUrl = 'http://localhost:8080/api/v1/agents';

  // CLIENTES PAGINADOS
  getClientsPaged(type: string, search: string, page: number, size: number, userId?: number, role?: string): Observable<any> {
    let params = new HttpParams()
      .set('clientType', type || 'ALL')
      .set('search', search || '')
      .set('page', page.toString())
      .set('size', size.toString());

    if (userId) params = params.set('userId', userId.toString());
    if (role) params = params.set('userRole', role);

    return this.http.get<any>(`${this.apiUrl}/paged`, { params });
  }

  // MÉTRICAS GLOBALES
  getSummaryMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/summary`);
  }

  // OBTENER ASESORES
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(this.agentsUrl);
  }

  // AUDITORÍA Y BITÁCORAS
  getClientAuditLogs(clientId: number): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/${clientId}/audit-logs`);
  }

  // SEGUIMIENTOS POR AGENTE
  getFollowUpsByAgent(agentId: number): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/follow-ups/agent/${agentId}`);
  }

  // AGREGAR BITÁCORA
  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/follow-ups`, payload);
  }

  // ASIGNACIÓN INDIVIDUAL / REASIGNACIÓN
  assignClientToUser(clientId: number, userId: number, actorName: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${clientId}/assign/${userId}?actorName=${encodeURIComponent(actorName)}`, {});
  }

  // LIBERAR CLIENTE (LLAMA A ASSIGN/0 SEGURA EN BACKEND)
  unassignClient(clientId: number, actorName: string): Observable<any> {
    return this.assignClientToUser(clientId, 0, actorName);
  }

  // ASIGNAR LOTE MASIVO
  assignDailyBatchToUser(userId: number, count: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign-batch/${userId}?count=${count}&actorName=${encodeURIComponent(actorName)}`, {});
  }

  // ALIAS PARA ASIGNAR A AGENTE
  assignBatchToAgent(agentId: number, count: number, actorName: string): Observable<any> {
    return this.assignDailyBatchToUser(agentId, count, actorName);
  }

  // AUTO-DISTRIBUCIÓN
  autoDistributeClients(countPerAgent: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auto-distribute?countPerAgent=${countPerAgent}&actorName=${encodeURIComponent(actorName)}`, {});
  }

  // ELIMINACIÓN DE CLIENTE
  deleteClient(clientId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clientId}`);
  }

  // CARGA DE EXCEL
  uploadExcel(file: File, actorName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/import-excel?actorName=${encodeURIComponent(actorName)}`, formData);
  }
}