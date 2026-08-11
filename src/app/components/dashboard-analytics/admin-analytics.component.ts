import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import Swal from 'sweetalert2';

export interface AgentMetric {
  id: number;
  fullName: string;
  username: string;
  totalAssigned: number;
  baseCount: number;
  benefitCount: number;
  completedFollowUps: number;
  effectiveness: number;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css'
})
export class AdminAnalyticsComponent implements OnInit {
  private clientService = inject(ClientService);

  isLoading = true;
  agentSearchFilter: string = '';

  // Métricas Generales
  totalPortfolioCount = 0;
  basePortfolioCount = 0;
  benefitPortfolioCount = 0;
  unassignedPortfolioCount = 0;
  totalAssignedClients = 0;

  get assignmentCoveragePercentage(): number {
    if (this.totalPortfolioCount === 0) return 0;
    return Math.round((this.totalAssignedClients / this.totalPortfolioCount) * 100);
  }

  // Métricas por Asesor
  agentsMetrics: AgentMetric[] = [];

  get filteredAgents(): AgentMetric[] {
    if (!this.agentSearchFilter.trim()) {
      return this.agentsMetrics;
    }
    const q = this.agentSearchFilter.toLowerCase().trim();
    return this.agentsMetrics.filter(a => 
      a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;

    // 1. Cargar Métricas Globales
    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.basePortfolioCount = m.base || 0;
        this.benefitPortfolioCount = m.benefit || 0;
        this.unassignedPortfolioCount = m.unassigned || 0;
        this.totalPortfolioCount = m.total || (this.basePortfolioCount + this.benefitPortfolioCount);
        this.totalAssignedClients = Math.max(0, this.totalPortfolioCount - this.unassignedPortfolioCount);
      },
      error: (err) => console.error('Error al cargar métricas globales:', err)
    });

    // 2. Cargar Asesores y desplegarlos INMEDIATAMENTE
    this.clientService.getAgents().subscribe({
      next: (agents: any[]) => {
        if (!agents || agents.length === 0) {
          this.agentsMetrics = [];
          this.isLoading = false;
          return;
        }

        // Mapeo inicial
        this.agentsMetrics = agents.map(agent => ({
          id: Number(agent.id),
          fullName: agent.fullName || agent.username || 'Asesor Comercial',
          username: agent.username || 'agente',
          totalAssigned: 0,
          baseCount: 0,
          benefitCount: 0,
          completedFollowUps: 0,
          effectiveness: 0
        }));

        // Quitamos la pantalla de carga para que el mosaico se pinte en pantalla inmediatamente
        this.isLoading = false;

        // Cargar métricas en segundo plano para cada asesor
        this.agentsMetrics.forEach(metric => {
          this.clientService.getClientsPaged('ALL', '', 0, 1000, metric.id, 'AGENT').subscribe({
            next: (res: any) => {
              const assignedList = res.content || [];
              metric.totalAssigned = res.totalElements !== undefined ? res.totalElements : assignedList.length;
              metric.baseCount = assignedList.filter((c: any) => c.clientType === 'BASE').length;
              metric.benefitCount = assignedList.filter((c: any) => c.clientType === 'BENEFIT' || c.clientType === 'BENEFICIOS').length;

              // Obtener seguimiento individual de bitácoras por agente
              this.clientService.getFollowUpsByAgent(metric.id).subscribe({
                next: (followUps: any[]) => {
                  metric.completedFollowUps = followUps ? followUps.length : 0;
                  const requiredGoal = metric.totalAssigned * 3;
                  metric.effectiveness = requiredGoal > 0 
                    ? Math.min(100, Math.round((metric.completedFollowUps / requiredGoal) * 100)) 
                    : 0;
                },
                error: () => {
                  metric.completedFollowUps = 0;
                  metric.effectiveness = 0;
                }
              });
            }
          });
        });
      },
      error: (err) => {
        console.error('Error al cargar lista de asesores:', err);
        this.isLoading = false;
      }
    });
  }

  // REPARTO MASIVO RÁPIDO
  assignBatchToAgent(agentId: number, count: number): void {
    const agent = this.agentsMetrics.find(a => a.id === agentId);
    const agentName = agent ? agent.fullName : 'Asesor';

    Swal.fire({
      title: `¿Asignar ${count} clientes a ${agentName}?`,
      text: 'Se tomarán cuentas de la Cartera Base sin asignar.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, asignar lote',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Asignando cartera...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        this.clientService.assignBatchToAgent(agentId, count, 'Administrador').subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Lote Asignado!',
              text: `Se asignaron ${count} clientes a ${agentName} exitosamente.`,
              timer: 1800,
              showConfirmButton: false
            });
            this.loadAnalyticsData();
          },
          error: (err: any) => {
            console.error('Error al asignar lote:', err);
            Swal.fire('Atención', 'No hay suficientes cuentas sin asignar disponibles.', 'warning');
          }
        });
      }
    });
  }
}