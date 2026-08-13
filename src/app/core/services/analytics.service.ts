import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  assignedClientsCount: number;
  completedFollowUpsCount: number;
  pendingFollowUpsCount: number;
}

export interface AnalyticsData {
  totalClients: number;
  assignedClients: number;
  unassignedClients: number;
  assignmentRate: number;
  totalFollowUps: number;
  overdueFollowUps: number;
  conversionRate: number;
  clientsBySegment: { [key: string]: number };
  agentPerformance: AgentPerformance[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/analytics`;

  getAdminAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.apiUrl}/admin`);
  }
}