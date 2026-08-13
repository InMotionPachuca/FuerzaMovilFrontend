import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';

export interface TodayLogItem {
  clientName: string;
  action: string;
  comments: string;
  timestamp: string;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  isLoading = true;
  agentName = '';
  greetingMessage = '¡Buenas tardes!';

  // Métricas operativas
  totalAssigned = 0;
  todayContactsCount = 0;
  completedGoalClients = 0; // Clientes con 3 o más intentos

  // Actividades registradas
  todayLogs: TodayLogItem[] = [];

  get progressPercentage(): number {
    if (this.totalAssigned === 0) return 0;
    const targetContacts = this.totalAssigned * 3;
    const percentage = Math.round((this.todayContactsCount / targetContacts) * 100);
    return Math.min(percentage, 100);
  }

  get goalCompletionPercentage(): number {
    if (this.totalAssigned === 0) return 0;
    const percentage = Math.round((this.completedGoalClients / this.totalAssigned) * 100);
    return Math.min(percentage, 100);
  }

  ngOnInit(): void {
    this.setGreeting();
    this.loadAgentMetrics();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingMessage = '¡Buenos días!';
    } else if (hour < 19) {
      this.greetingMessage = '¡Buenas tardes!';
    } else {
      this.greetingMessage = '¡Buenas noches!';
    }
  }

  loadAgentMetrics(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.agentName = user.fullName || user.username || 'Asesor';
    const userIdNum = Number(user.id);
    const userRole = String(user.role || 'AGENT');

    // 1. Obtener la cartera asignada
    this.clientService.getClientsPaged('ALL', 'ASSIGNED', 0, 1000, userIdNum, userRole).subscribe({
      next: (res: any) => {
        const clients = res.content || res || [];
        this.totalAssigned = res.totalElements !== undefined ? res.totalElements : clients.length;

        // Mapeo rápido para calcular clientes con meta de 3 intentos
        let goalReached = 0;
        clients.forEach((c: any) => {
          if ((c.followUpsCount || 0) >= 3) {
            goalReached++;
          }
        });
        this.completedGoalClients = goalReached;

        // 2. Obtener Bitácoras globales del Asesor (Eficiente y en una sola petición)
        this.clientService.getFollowUpsByAgent(userIdNum).subscribe({
          next: (logs: any[]) => {
            const rawLogs = logs || [];
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            // Filtrar las bitácoras registradas el día de HOY
            const filteredToday = rawLogs.filter((log: any) => {
              if (!log.timestamp && !log.createdAt) return false;
              const dateVal = String(log.timestamp || log.createdAt);
              return dateVal.substring(0, 10) === todayStr;
            });

            this.todayContactsCount = filteredToday.length;

            this.todayLogs = filteredToday.map((log: any) => ({
              clientName: log.batchName || log.clientName || 'Cliente en Cartera',
              action: log.action || 'INTERACCIÓN',
              comments: log.description || log.comments || 'Sin observaciones.',
              timestamp: log.timestamp || log.createdAt
            }));

            // Ordenar de más reciente a más antiguo
            this.todayLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al cargar bitácoras del agente:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar la cartera del agente:', err);
        this.isLoading = false;
      }
    });
  }

  getActionBadgeClass(action: string): string {
    const act = (action || '').toUpperCase();
    if (act.includes('WHATSAPP')) return 'bg-success text-white';
    if (act.includes('LLAMADA') || act.includes('TEL')) return 'bg-primary text-white';
    if (act.includes('CORREO') || act.includes('EMAIL')) return 'bg-info text-dark';
    if (act.includes('AGENCIA') || act.includes('VISITA')) return 'bg-warning text-dark';
    return 'bg-danger text-white';
  }
}