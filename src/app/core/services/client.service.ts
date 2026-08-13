import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLogDTO {
  id?: number;
  action: string;
  description: string;
  actorName: string;
  batchName?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/clients';

  getClientsPaged(clientType: string, assignmentStatus: string, page: number, size: number, userId?: number, userRole?: string, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('clientType', clientType || 'ALL')
      .set('assignmentStatus', assignmentStatus || 'UNASSIGNED')
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (userId) params = params.set('userId', userId.toString());
    if (userRole) params = params.set('userRole', userRole);

    return this.http.get<any>(`${this.apiUrl}/paged`, { params });
  }

  getSummaryMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/summary`);
  }

  assignClientToUser(clientId: number, userId: number, actorName?: string): Observable<any> {
    let params = new HttpParams();
    if (actorName) params = params.set('actorName', actorName);
    return this.http.put<any>(`${this.apiUrl}/${clientId}/assign/${userId}`, {}, { params });
  }

  unassignClient(clientId: number, actorName?: string): Observable<any> {
    let params = new HttpParams();
    if (actorName) params = params.set('actorName', actorName);
    return this.http.put<any>(`${this.apiUrl}/${clientId}/assign/0`, {}, { params });
  }

  assignBatchToAgent(agentId: number, count: number, actorName?: string): Observable<any> {
    let params = new HttpParams().set('count', count.toString());
    if (actorName) params = params.set('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/assign-batch/${agentId}`, {}, { params });
  }

  assignVIPBatchToAgent(agentId: number, count: number, actorName?: string): Observable<any> {
    let params = new HttpParams().set('count', count.toString());
    if (actorName) params = params.set('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/assign-vip-batch/${agentId}`, {}, { params });
  }

  autoDistributeClients(countPerAgent: number, actorName?: string): Observable<any> {
    let params = new HttpParams().set('countPerAgent', countPerAgent.toString());
    if (actorName) params = params.set('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/auto-distribute`, {}, { params });
  }

  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/follow-ups`, payload);
  }

  uploadExcel(file: File, actorName?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    let params = new HttpParams();
    if (actorName) params = params.set('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/import-excel`, formData, { params });
  }

  deleteClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}`);
  }

  // OPCIÓN A: RUTA CORREGIDA A /api/v1/auth/users
  getAgents(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/v1/auth/users');
  }

  getFollowUpsByAgent(agentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/follow-ups/agent/${agentId}`);
  }

  getClientAuditLogs(clientId: number): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/${clientId}/audit-logs`);
  }
}