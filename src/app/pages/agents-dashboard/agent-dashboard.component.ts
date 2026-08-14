import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  currentUser: any = null;
  isLoading = false;

  agentName = '';
  greetingMessage = '';

  totalAssigned = 0;
  completedGoalClients = 0;
  pendingFollowUps = 0;
  todayContactsCount = 0;

  allFollowUps: any[] = [];
  todayLogs: any[] = [];

  get progressPercentage(): number {
    if (this.totalAssigned === 0) return 0;
    const metaTotal = this.totalAssigned * 3;
    if (metaTotal === 0) return 0;
    return Math.min(100, Math.round((this.allFollowUps.length / metaTotal) * 100));
  }

  get goalCompletionPercentage(): number {
    if (this.totalAssigned === 0) return 0;
    return Math.min(100, Math.round((this.completedGoalClients / this.totalAssigned) * 100));
  }

  ngOnInit(): void {
    this.setupGreetingAndUser();
    this.loadAgentMetrics();
  }

  setupGreetingAndUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.agentName = this.currentUser?.fullName || this.currentUser?.username || 'Asesor Comercial';

    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingMessage = '¡Buenos días,';
    } else if (hour < 19) {
      this.greetingMessage = '¡Buenas tardes,';
    } else {
      this.greetingMessage = '¡Buenas noches,';
    }
  }

  loadAgentMetrics(): void {
    const userIdNum = this.currentUser?.id;
    if (!userIdNum) return;

    this.isLoading = true;

    this.clientService.getFollowUpsByAgent(userIdNum).subscribe({
      next: (logs: any[]) => {
        this.allFollowUps = logs || [];

        const todayStr = new Date().toISOString().slice(0, 10);
        this.todayLogs = this.allFollowUps.filter((log: any) => {
          const logDate = log.createdAt || log.fecha || log.timestamp;
          return logDate ? String(logDate).startsWith(todayStr) : false;
        });

        this.todayContactsCount = this.todayLogs.length;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar seguimientos del asesor:', err);
        this.allFollowUps = [];
        this.todayLogs = [];
        this.isLoading = false;
      }
    });

    this.clientService.getClientsPaged('ALL', 'ASSIGNED', 0, 1000, userIdNum, 'AGENT', '').subscribe({
      next: (res: any) => {
        const clients = res.content || [];
        this.totalAssigned = res.totalElements !== undefined ? res.totalElements : clients.length;

        let completed = 0;
        clients.forEach((c: any) => {
          if ((c.followUpsCount || 0) >= 3) {
            completed++;
          }
        });

        this.completedGoalClients = completed;
        this.pendingFollowUps = Math.max(0, this.totalAssigned - completed);
      },
      error: (err: any) => {
        console.error('Error al obtener clientes del asesor:', err);
      }
    });
  }

  getActionBadgeClass(action: string): string {
    const act = String(action || '').toUpperCase();
    if (act.includes('WHATSAPP')) return 'bg-success-subtle text-success border border-success-subtle';
    if (act.includes('LLAMADA') || act.includes('CALL')) return 'bg-primary-subtle text-primary border border-primary-subtle';
    if (act.includes('CORREO') || act.includes('EMAIL')) return 'bg-info-subtle text-info border border-info-subtle';
    if (act.includes('CITA') || act.includes('VISITA')) return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }
}