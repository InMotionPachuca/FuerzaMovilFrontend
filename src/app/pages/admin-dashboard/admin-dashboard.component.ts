import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  isLoading = true;
  Math = Math;

  // Métricas de Cartera
  totalPortfolioCount = 0;
  baseCount = 0;
  benefitCount = 0;
  unassignedCount = 0;
  assignedClientsCount = 0;
  totalAgentsCount = 0;

  get coveragePercentage(): number {
    if (this.totalPortfolioCount === 0) return 0;
    return Math.round((this.assignedClientsCount / this.totalPortfolioCount) * 100);
  }

  // Top Asesores por Desempeño
  topAgentsList: any[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // 1. Cargar Métricas Globales Reales
    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.baseCount = m.base || 0;
        this.benefitCount = m.benefit || 0;
        this.unassignedCount = m.unassigned || 0;
        this.totalPortfolioCount = m.total || (this.baseCount + this.benefitCount);
        this.assignedClientsCount = Math.max(0, this.totalPortfolioCount - this.unassignedCount);
      },
      error: (err) => console.error('Error al cargar métricas ejecutivas:', err)
    });

    // 2. Cargar Asesores y Calcular la Efectividad Individual
    this.clientService.getAgents().subscribe({
      next: (agents: any[]) => {
        this.totalAgentsCount = agents ? agents.length : 0;

        if (!agents || agents.length === 0) {
          this.topAgentsList = [];
          this.isLoading = false;
          return;
        }

        let loadedAgents = 0;
        const tempAgents: any[] = [];

        agents.forEach(agent => {
          const agentId = Number(agent.id);

          // A. Obtener clientes asignados individualmente a este agente
          this.clientService.getClientsPaged('ALL', '', 0, 1000, agentId, 'AGENT').subscribe({
            next: (res: any) => {
              const assignedList = res.content || [];
              const totalAssigned = res.totalElements !== undefined ? res.totalElements : assignedList.length;

              if (assignedList.length === 0) {
                tempAgents.push({
                  id: agentId,
                  fullName: agent.fullName || agent.username || 'Asesor Comercial',
                  totalAssigned: 0,
                  completedFollowUps: 0,
                  effectiveness: 0
                });

                loadedAgents++;
                if (loadedAgents === agents.length) {
                  this.sortAndSetTopAgents(tempAgents);
                }
                return;
              }

              // B. Contar únicamente las bitácoras reales registradas para los clientes de este agente
              let agentFollowUpsCount = 0;
              let logsLoaded = 0;

              assignedList.forEach((client: any) => {
                this.clientService.getClientAuditLogs(client.id).subscribe({
                  next: (logs: any[]) => {
                    agentFollowUpsCount += (logs ? logs.length : 0);
                    logsLoaded++;

                    if (logsLoaded === assignedList.length) {
                      const requiredGoal = totalAssigned * 3; // Meta: 3 contactos por cliente
                      const effectiveness = requiredGoal > 0 
                        ? Math.min(100, Math.round((agentFollowUpsCount / requiredGoal) * 100)) 
                        : 0;

                      tempAgents.push({
                        id: agentId,
                        fullName: agent.fullName || agent.username || 'Asesor Comercial',
                        totalAssigned: totalAssigned,
                        completedFollowUps: agentFollowUpsCount,
                        effectiveness: effectiveness
                      });

                      loadedAgents++;
                      if (loadedAgents === agents.length) {
                        this.sortAndSetTopAgents(tempAgents);
                      }
                    }
                  },
                  error: () => {
                    logsLoaded++;
                    if (logsLoaded === assignedList.length) {
                      loadedAgents++;
                      if (loadedAgents === agents.length) {
                        this.sortAndSetTopAgents(tempAgents);
                      }
                    }
                  }
                });
              });
            },
            error: () => {
              loadedAgents++;
              if (loadedAgents === agents.length) {
                this.sortAndSetTopAgents(tempAgents);
              }
            }
          });
        });
      },
      error: (err) => {
        console.error('Error al cargar lista de agentes:', err);
        this.isLoading = false;
      }
    });
  }

  private sortAndSetTopAgents(list: any[]): void {
    // Ordenar de mayor a menor porcentaje de efectividad y tomar los primeros 5
    this.topAgentsList = list
      .sort((a, b) => b.effectiveness - a.effectiveness || b.completedFollowUps - a.completedFollowUps)
      .slice(0, 5);
    this.isLoading = false;
  }

  triggerAutoDistribute(countPerAgent: number): void {
    const actor = this.authService.getCurrentUser()?.fullName || 'Administrador';

    Swal.fire({
      title: `¿Distribuir ${countPerAgent} cuentas a cada asesor?`,
      text: `Se asignarán automáticamente a los ${this.totalAgentsCount} asesores registrados.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, autodistribuir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Repartiendo cartera...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        this.clientService.autoDistributeClients(countPerAgent, actor).subscribe({
          next: (res: any) => {
            Swal.fire('¡Distribución Exitosa!', `Se asignaron ${res.totalAssigned || 0} cuentas en total.`, 'success');
            this.loadDashboardData();
          },
          error: (err: any) => {
            console.error('Error al auto-distribuir:', err);
            Swal.fire('Error', 'No fue posible realizar la auto-distribución.', 'error');
          }
        });
      }
    });
  }
}