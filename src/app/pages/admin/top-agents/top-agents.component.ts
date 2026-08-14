import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ClientService } from '../../../core/services/client.service';
import Swal from 'sweetalert2';

export interface TopAgentRow {
  id: number;
  fullName: string;
  username: string;
  isTopAgent: boolean;
}

@Component({
  selector: 'app-top-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './top-agents.component.html',
  styleUrl: './top-agents.component.css'
})
export class TopAgentsComponent implements OnInit {
  private clientService = inject(ClientService);

  isLoading = true;
  searchQuery = '';
  totalVIPClientsAvailable = 0;

  allAgents: TopAgentRow[] = [];

  // ESTADOS DEL MODAL DE ASIGNACIÓN MANUAL
  showAssignModal = false;
  selectedAgentForAssign: TopAgentRow | null = null;
  unassignedVIPClients: any[] = [];
  isLoadingVIPClients = false;
  vipModalSearchQuery = '';

  get topAgentsOnly(): TopAgentRow[] {
    let list = this.allAgents.filter(a => a.isTopAgent);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(a => a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));
    }
    return list;
  }

  get availableAgentsToPromote(): TopAgentRow[] {
    return this.allAgents.filter(a => !a.isTopAgent);
  }

  get filteredVIPClients(): any[] {
    if (!this.vipModalSearchQuery.trim()) return this.unassignedVIPClients;
    const q = this.vipModalSearchQuery.toLowerCase().trim();
    return this.unassignedVIPClients.filter(c => {
      const name = (c.companyName || c.nombreDelCliente || '').toLowerCase();
      const rfc = (c.taxId || c.rfc || '').toLowerCase();
      const model = (c.vehicleModel || c.brand || '').toLowerCase();
      return name.includes(q) || rfc.includes(q) || model.includes(q);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.totalVIPClientsAvailable = m.benefit || 0;
      },
      error: (err: any) => {
        console.error('Error al cargar métricas de VIP:', err);
      }
    });

    this.clientService.getAgents().subscribe({
      next: (users: any[]) => {
        const agentsOnly = (users || []).filter((u: any) =>
          u.role && (u.role === 'AGENT' || u.role === 'ROLE_AGENT' || u.role.name === 'AGENT') &&
          u.username !== 'admin@agencia.com'
        );

        this.allAgents = agentsOnly.map((a: any) => ({
          id: a.id || a.userId || a.agentId,
          fullName: a.fullName || a.username,
          username: a.username,
          isTopAgent: a.isTopAgent || a.topAgent || false
        }));

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar agentes:', err);
        this.isLoading = false;
      }
    });
  }

  toggleTopAgentStatus(agent: TopAgentRow): void {
    const previousState = agent.isTopAgent;
    agent.isTopAgent = !agent.isTopAgent;

    this.clientService.toggleTopAgentStatus(agent.id).subscribe({
      next: () => {
        const title = agent.isTopAgent ? '¡Asesor Ascendido a Top Agent!' : 'Asesor Removido';
        const text = agent.isTopAgent
          ? `${agent.fullName} ahora es elegible para recibir cartera con Beneficios VIP.`
          : `${agent.fullName} regresó al listado general de FuerzaMóvil.`;

        Swal.fire({
          icon: agent.isTopAgent ? 'success' : 'info',
          title: title,
          text: text,
          confirmButtonColor: '#EB0A1E',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        console.error('Error al actualizar estatus:', err);
        agent.isTopAgent = previousState;
        Swal.fire('Error', 'No se pudo guardar la preferencia en el servidor.', 'error');
      }
    });
  }

  promoteAgentFromSelect(event: any): void {
    const agentId = Number(event.target.value);
    if (!agentId) return;

    const agent = this.allAgents.find(a => a.id === agentId);
    if (agent) {
      this.toggleTopAgentStatus(agent);
    }
    event.target.value = '';
  }

  openManualAssignModal(agent: TopAgentRow): void {
    this.selectedAgentForAssign = agent;
    this.showAssignModal = true;
    this.vipModalSearchQuery = '';
    this.loadUnassignedVIPClients();
  }

  closeManualAssignModal(): void {
    this.showAssignModal = false;
    this.selectedAgentForAssign = null;
    this.unassignedVIPClients = [];
  }

  loadUnassignedVIPClients(): void {
    this.isLoadingVIPClients = true;
    // Cambiamos 'VIP' por 'BENEFIT' para consultar estrictamente la tabla benefits
    this.clientService.getClientsPaged('BENEFIT', 'UNASSIGNED', 0, 100, undefined, 'ADMIN', '').subscribe({
      next: (res: any) => {
        this.unassignedVIPClients = res.content || [];
        this.isLoadingVIPClients = false;
      },
      error: () => {
        this.unassignedVIPClients = [];
        this.isLoadingVIPClients = false;
      }
    });
  }

  assignSpecificVIPClient(client: any): void {
    if (!this.selectedAgentForAssign) return;

    const targetAgent = this.selectedAgentForAssign;
    const clientId = client.id || client.clientId || client.idCartera;
    const agentId = targetAgent.id;

    const agentName = targetAgent.fullName;
    const clientName = client.companyName || client.nombreDelCliente || 'Cliente Beneficio';

    if (!clientId || !agentId) {
      Swal.fire('Error', 'No se identificó el ID del cliente o del asesor.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Asignación?',
      html: `Se asignará el <strong>Cliente Beneficio</strong> <strong>${clientName}</strong> a <strong>${agentName}</strong>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, asignar cliente',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Asignando en Base de Datos...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.clientService.assignClientToUser(clientId, agentId, 'Administrador Principal').subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Cliente Beneficio Asignado!',
              text: `${clientName} asignado correctamente a ${agentName}.`,
              timer: 1500,
              showConfirmButton: false
            });
            this.loadUnassignedVIPClients();
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error al asignar:', err);
            Swal.fire('Error', 'No se pudo realizar la asignación en el servidor.', 'error');
          }
        });
      }
    });
  }
}