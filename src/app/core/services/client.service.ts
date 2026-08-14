import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'https://fuerzamovilbackend.onrender.com/api/v1/clients';

  /**
   * Consulta paginada de cartera de clientes.
   * Envía los parámetros con nombres exactos para Spring Boot.
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

    return this.http.get<any>(`${this.apiUrl}/paged`, { params });
  }

  getSummaryMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/summary`);
  }

  getAgents(): Observable<any[]> {
    return this.http.get<any[]>(`https://fuerzamovilbackend.onrender.com/api/v1/users`);
  }

  assignClientToUser(clientId: number, userId: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/assign`, { userId, actorName });
  }

  unassignClient(clientId: number, actorName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/unassign`, { actorName });
  }

  uploadExcel(file: File, actorName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('actorName', actorName);
    return this.http.post<any>(`${this.apiUrl}/import/excel`, formData);
  }

  getClientAuditLogs(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/audit-logs`);
  }

  addFollowUp(clientId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clientId}/follow-ups`, payload);
  }

  deleteClient(clientId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clientId}`);
  }
}