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
  totalAssigned?: number;
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
  searchQuery = '';
  totalPortfolio = 0;
  totalAgentsCount = 0;
  agentsList: AgentRow[] = [];

  get filteredAgents(): AgentRow[] {
    if (!this.searchQuery.trim()) return this.agentsList;
    const q = this.searchQuery.toLowerCase().trim();
    return this.agentsList.filter(a => a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => this.totalPortfolio = m.total || 0,
      error: (err: any) => console.error('Error métricas:', err)
    });

    this.clientService.getAgents().subscribe({
      next: (agents: any[]) => {
        const agentsOnly = (agents || []).filter((u: any) => 
          u.role && (u.role === 'AGENT' || u.role === 'ROLE_AGENT' || u.role.name === 'AGENT') && 
          u.username !== 'admin@agencia.com'
        );

        this.totalAgentsCount = agentsOnly.length;
        this.agentsList = agentsOnly.map((a: any) => ({
          id: a.id,
          fullName: a.fullName || a.username,
          username: a.username,
          role: a.role,
          totalAssigned: 0
        }));
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar asesores:', err);
        this.isLoading = false;
      }
    });
  }

  // ACCIÓN DE REPARTIR LOTE BASE A TODA LA PLANTILLA
  assignBatchToAll(): void {
    Swal.fire({
      title: '¿Repartir Lote Base a toda la Plantilla?',
      text: `Se asignarán 10 cuentas de la Cartera Base a cada uno de los ${this.totalAgentsCount} asesores.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, auto-repartir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.autoDistributeClients(10, 'Administrador Principal').subscribe({
          next: (res: any) => {
            Swal.fire('¡Distribución Completada!', `Se repartieron ${res.totalAssigned || 0} cuentas entre los asesores.`, 'success');
            this.loadData();
          },
          error: () => Swal.fire('Error', 'No hay suficientes cuentas libres para repartir.', 'error')
        });
      }
    });
  }
}