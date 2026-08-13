import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getSummaryMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clients/metrics/summary`);
  }

  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agents`);
  }

  toggleTopAgentStatus(agentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/agents/${agentId}/toggle-top-agent`, {});
  }

  getClientsPaged(
    type: string,
    status: string,
    page: number,
    size: number,
    agentId?: number,
    role?: string,
    search?: string
  ): Observable<any> {
    let url = `${this.apiUrl}/clients/paged?clientType=${type}&assignmentStatus=${status}&page=${page}&size=${size}`;
    if (agentId) url += `&userId=${agentId}`;
    if (role) url += `&userRole=${role}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get(url);
  }

  assignClientToUser(clientId: number, userId: number, actorName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/clients/${clientId}/assign/${userId}?actorName=${encodeURIComponent(actorName)}`, {});
  }

  unassignClient(clientId: number, actorName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/clients/${clientId}/assign/0?actorName=${encodeURIComponent(actorName)}`, {});
  }

  assignBatchToAgent(agentId: number, count: number, actorName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/assign-batch/${agentId}?count=${count}&actorName=${encodeURIComponent(actorName)}`, {});
  }

  autoDistributeClients(countPerAgent: number, actorName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/auto-distribute?countPerAgent=${countPerAgent}&actorName=${encodeURIComponent(actorName)}`, {});
  }

  getClientAuditLogs(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clients/${clientId}/audit-logs`);
  }

  getFollowUpsByAgent(agentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clients/follow-ups/agent/${agentId}`);
  }

  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${clientId}/follow-ups`, payload);
  }

  deleteClient(clientId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clients/${clientId}`);
  }

  uploadExcel(file: File, actorName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/clients/import-excel?actorName=${encodeURIComponent(actorName)}`, formData);
  }
}