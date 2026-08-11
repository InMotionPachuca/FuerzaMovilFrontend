import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  isLoading = true;

  // Métricas operativas en tiempo real
  totalAssigned = 0;
  todayContactsCount = 0;
  completedGoalClients = 0; // Clientes con 3/3 intentos

  // Actividades realizadas HOY
  todayLogs: any[] = [];

  get progressPercentage(): number {
    if (this.totalAssigned === 0) return 0;
    // Meta estimada: 3 contactos por cliente asignado
    const percentage = Math.round((this.todayContactsCount / (this.totalAssigned * 3)) * 100);
    return Math.min(percentage, 100);
  }

  ngOnInit(): void {
    this.loadAgentMetrics();
  }

  loadAgentMetrics(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const userIdNum = Number(user.id);
    const userRole = String(user.role || 'AGENT');

    // 1. Cargar únicamente el lote activo asignado al agente
    this.clientService.getClientsPaged('ALL', '', 0, 1000, userIdNum, userRole).subscribe({
      next: (res: any) => {
        const rawClients = res.content || res || [];
        this.totalAssigned = res.totalElements !== undefined ? res.totalElements : rawClients.length;

        if (rawClients.length === 0) {
          this.isLoading = false;
          return;
        }

        let loadedCount = 0;
        this.todayContactsCount = 0;
        this.completedGoalClients = 0;
        this.todayLogs = [];

        // Obtener fecha de HOY en formato YYYY-MM-DD local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // 2. Consultar logs cliente por cliente para obtener conteo estricto del día
        rawClients.forEach((client: any) => {
          this.clientService.getClientAuditLogs(client.id).subscribe({
            next: (logs: any[]) => {
              const clientLogs = logs || [];

              if (clientLogs.length >= 3) {
                this.completedGoalClients++;
              }

              // Filtrar bitácoras registradas HOY
              const logsToday = clientLogs.filter(log => {
                if (!log.timestamp) return false;
                const logDateStr = String(log.timestamp).substring(0, 10);
                return logDateStr === todayStr;
              });

              this.todayContactsCount += logsToday.length;

              logsToday.forEach(log => {
                this.todayLogs.push({
                  clientName: client.companyName || client.nombreDelCliente,
                  action: log.action || 'CONTACTO',
                  comments: log.description || log.comments,
                  timestamp: log.timestamp
                });
              });

              loadedCount++;
              if (loadedCount === rawClients.length) {
                this.finishLoading();
              }
            },
            error: () => {
              loadedCount++;
              if (loadedCount === rawClients.length) this.finishLoading();
            }
          });
        });
      },
      error: (err) => {
        console.error('Error al consultar cartera del agente:', err);
        this.isLoading = false;
      }
    });
  }

  private finishLoading(): void {
    // Ordenar actividad por hora más reciente
    this.todayLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.isLoading = false;
  }
}