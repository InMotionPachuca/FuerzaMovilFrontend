import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
import Swal from 'sweetalert2';

export interface AgentRow {
  id: number;
  fullName: string;
  username: string;
  role: string;
  totalAssigned: number;
  baseCount: number;
  benefitCount: number;
  completedFollowUps: number;
  effectiveness: number;
}

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.css'
})
export class AgentListComponent implements OnInit {
  private clientService = inject(ClientService);

  isLoading = true;
  activeTab: 'performance' | 'list' | 'audit' = 'performance';
  searchQuery = '';
  selectedAuditAgentId: number | null = null;

  // MODAL DETALLE DE CUENTAS ASIGNADAS AL ASESOR
  showAgentDetailModal = false;
  selectedAgentForDetail: AgentRow | null = null;
  agentClientsList: any[] = [];
  isLoadingAgentClients = false;

  // Métricas de Encabezado
  totalPortfolio = 0;
  totalAssignedToday = 0;
  totalAgentsCount = 0;

  // Listas
  agentsList: AgentRow[] = [];
  globalAuditLogs: any[] = [];

  get filteredAgents(): AgentRow[] {
    let list = this.agentsList;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(a => a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));
    }

    if (this.activeTab === 'performance') {
      return [...list].sort((a, b) => b.effectiveness - a.effectiveness);
    }

    return list;
  }

  get filteredAuditLogs(): any[] {
    if (!this.selectedAuditAgentId) {
      return this.globalAuditLogs;
    }
    return this.globalAuditLogs.filter(log => log.agentId === this.selectedAuditAgentId);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.totalPortfolio = m.total || 0;
      },
      error: (err) => console.error('Error al cargar métricas:', err)
    });

    this.clientService.getAgents().subscribe({
      next: (agents: any[]) => {
        const agentsOnly = (agents || []).filter(u => 
          u.role && !u.role.toUpperCase().includes('ADMIN') && u.username !== 'admin@agencia.com'
        );

        this.totalAgentsCount = agentsOnly.length;
        this.agentsList = [];
        this.globalAuditLogs = [];

        if (agentsOnly.length === 0) {
          this.isLoading = false;
          return;
        }

        let loaded = 0;
        agentsOnly.forEach(agent => {
          this.clientService.getClientsPaged('ALL', '', 0, 1000, agent.id, 'AGENT').subscribe({
            next: (res: any) => {
              const clients = res.content || [];
              const totalAssigned = res.totalElements !== undefined ? res.totalElements : clients.length;
              const baseCount = clients.filter((c: any) => c.clientType === 'BASE').length;
              const benefitCount = clients.filter((c: any) => c.clientType === 'BENEFIT' || c.clientType === 'BENEFICIOS').length;

              this.clientService.getFollowUpsByAgent(agent.id).subscribe({
                next: (followUps: any[]) => {
                  const completed = followUps ? followUps.length : 0;
                  const effectiveness = totalAssigned > 0 
                    ? Math.min(100, Math.round((completed / totalAssigned) * 100))
                    : 0;

                  if (followUps && followUps.length > 0) {
                    followUps.forEach(f => {
                      this.globalAuditLogs.push({
                        ...f,
                        agentId: agent.id,
                        agentName: agent.fullName || agent.username
                      });
                    });
                  }

                  this.agentsList.push({
                    id: agent.id,
                    fullName: agent.fullName || agent.username,
                    username: agent.username,
                    role: agent.role,
                    totalAssigned,
                    baseCount,
                    benefitCount,
                    completedFollowUps: completed,
                    effectiveness
                  });

                  loaded++;
                  if (loaded === agentsOnly.length) {
                    this.totalAssignedToday = this.agentsList.reduce((acc, curr) => acc + curr.totalAssigned, 0);
                    this.isLoading = false;
                  }
                },
                error: () => {
                  loaded++;
                  if (loaded === agentsOnly.length) this.isLoading = false;
                }
              });
            },
            error: () => {
              loaded++;
              if (loaded === agentsOnly.length) this.isLoading = false;
            }
          });
        });
      },
      error: (err) => {
        console.error('Error al cargar asesores:', err);
        this.isLoading = false;
      }
    });
  }

  // ABRIR EL DESGLOSE DE CUENTAS ASIGNADAS AL ASESOR
  openAgentDetailModal(agent: AgentRow): void {
    this.selectedAgentForDetail = agent;
    this.showAgentDetailModal = true;
    this.loadAgentClients(agent.id);
  }

  loadAgentClients(agentId: number): void {
    this.isLoadingAgentClients = true;
    this.agentClientsList = [];

    this.clientService.getClientsPaged('ALL', '', 0, 1000, agentId, 'AGENT').subscribe({
      next: (res: any) => {
        this.agentClientsList = res.content || [];
        this.isLoadingAgentClients = false;
      },
      error: (err) => {
        console.error('Error al obtener clientes del asesor:', err);
        this.isLoadingAgentClients = false;
      }
    });
  }

  closeAgentDetailModal(): void {
    this.showAgentDetailModal = false;
    this.selectedAgentForDetail = null;
    this.agentClientsList = [];
  }

  // QUITAR / DESASIGNAR UN CLIENTE ESPECÍFICO DE UN ASESOR
  unassignClientFromAgent(client: any): void {
    const clientName = client.companyName || client.nombreDelCliente || 'el cliente';
    const agentName = this.selectedAgentForDetail ? this.selectedAgentForDetail.fullName : 'este asesor';

    Swal.fire({
      title: '¿Quitar cuenta asignada?',
      text: `Se removerá a ${clientName} del lote de ${agentName} y quedará como cuenta libre.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Al enviar userId = 0 o null, el backend libera la cuenta
        this.clientService.assignClientToUser(client.id, 0, 'Administrador').subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Cuenta Liberada',
              text: `${clientName} ya no pertenece al lote del asesor.`,
              timer: 1800,
              showConfirmButton: false
            });

            // Refresca la lista modal y el contador general
            if (this.selectedAgentForDetail) {
              this.loadAgentClients(this.selectedAgentForDetail.id);
            }
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error al desasignar cliente:', err);
            Swal.fire('Error', 'No se pudo desasignar el cliente.', 'error');
          }
        });
      }
    });
  }

  // REASIGNAR DIRECTAMENTE UN CLIENTE A OTRO ASESOR
  reassignClientToNewAgent(client: any, event: any): void {
    const targetUserId = Number(event.target.value);
    if (!targetUserId) return;

    const clientName = client.companyName || client.nombreDelCliente || 'el cliente';
    const newAgent = this.agentsList.find(a => a.id === targetUserId);
    const newAgentName = newAgent ? newAgent.fullName : 'el nuevo asesor';

    this.clientService.assignClientToUser(client.id, targetUserId, 'Administrador').subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Reasignado a ${newAgentName}`,
          showConfirmButton: false,
          timer: 2000
        });

        if (this.selectedAgentForDetail) {
          this.loadAgentClients(this.selectedAgentForDetail.id);
        }
        this.loadData();
      },
      error: (err: any) => {
        console.error('Error al reasignar cliente:', err);
        Swal.fire('Error', 'No se pudo reasignar el cliente.', 'error');
      }
    });
  }

  assignBatch(agentId: number, count: number): void {
    const agent = this.agentsList.find(a => a.id === agentId);
    const agentName = agent ? agent.fullName : 'Asesor';

    Swal.fire({
      title: `¿Asignar ${count} clientes a ${agentName}?`,
      text: 'Se asignarán cuentas libres de Cartera Base.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.assignBatchToAgent(agentId, count, 'Administrador').subscribe({
          next: () => {
            Swal.fire('¡Asignado!', `Se asignó el lote a ${agentName}.`, 'success');
            if (this.showAgentDetailModal && this.selectedAgentForDetail?.id === agentId) {
              this.loadAgentClients(agentId);
            }
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error al asignar lote:', err);
            Swal.fire('Error', 'No hay suficientes cuentas libres disponibles.', 'error');
          }
        });
      }
    });
  }

  autoDistributeAll(): void {
    Swal.fire({
      title: '¿Auto-repartir Lote Base?',
      text: `Se asignarán 10 cuentas de la Cartera Base libre a cada uno de los ${this.totalAgentsCount} asesores.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, auto-repartir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Repartiendo cartera...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        this.clientService.autoDistributeClients(10, 'Administrador').subscribe({
          next: (res: any) => {
            Swal.fire('¡Éxito!', `Se distribuyeron ${res.totalAssigned || 0} cuentas entre los asesores.`, 'success');
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error al auto-distribuir:', err);
            Swal.fire('Error', 'No se pudo completar la distribución.', 'error');
          }
        });
      }
    });
  }

  inspectAgent(agent: AgentRow): void {
    this.selectedAuditAgentId = agent.id;
    this.activeTab = 'audit';
  }

  selectTab(tab: 'performance' | 'list' | 'audit'): void {
    this.activeTab = tab;
  }
}