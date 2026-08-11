import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService, AuditLogDTO } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  // Datos principales
  clients: any[] = [];
  agents: any[] = [];
  auditLogs: AuditLogDTO[] = [];
  clientFollowUpsHistory: any[] = [];

  // Paginación y Filtros
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  selectedType = 'ALL';
  searchQuery = '';

  // Filtro de Estatus de Asignación ('ALL' | 'UNASSIGNED' | 'ASSIGNED')
  assignmentStatusFilter: string = 'ALL';

  // Métricas Administrador
  summaryTotalPortfolio = 0;
  benefitClientsCount = 0;
  unassignedClientsCount = 0;
  completedFollowUpsCount = 0;

  // Métricas Asesor
  myAssignedTotal = 0;
  inProgressCount = 0;
  completedGoalCount = 0;

  // Estado e Interfaz
  isLoading = true;
  isLoadingHistory = false;

  // Modales
  showDetailModal = false;
  showToolsModal = false;
  selectedClientForTools: any = null;
  selectedClientForDetail: any = null;

  // Campos Bitácora
  contactMethod: string = 'WHATSAPP';
  followUpStatus: string = 'INTERESADO';
  followUpComments: string = '';

  get isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return !!user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN');
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    if (this.isAdmin) {
      this.loadAgentsList();
      this.loadMetrics();
    }
    this.fetchClients();
  }

  loadAgentsList(): void {
    this.clientService.getAgents().subscribe({
      next: (data: any[]) => this.agents = data || [],
      error: (err: any) => console.error('Error al cargar agentes:', err)
    });
  }

  loadMetrics(): void {
    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.summaryTotalPortfolio = m.total || 0;
        this.benefitClientsCount = m.benefit || 0;
        this.unassignedClientsCount = m.unassigned || 0;
      },
      error: (err: any) => console.error('Error al cargar métricas:', err)
    });
  }

  fetchClients(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? Number(currentUser.id) : 0;
    const role = currentUser ? String(currentUser.role) : 'AGENT';

    this.clientService.getClientsPaged(
      this.selectedType,
      this.searchQuery,
      this.currentPage,
      this.pageSize,
      userId,
      role
    ).subscribe({
      next: (res: any) => {
        let rawList = res.content || res || [];

        // Filtro local opcional para la asignación
        if (this.isAdmin && this.assignmentStatusFilter !== 'ALL') {
          if (this.assignmentStatusFilter === 'UNASSIGNED') {
            rawList = rawList.filter((c: any) => !c.assignedUserId && !c.assignedUserName);
          } else if (this.assignmentStatusFilter === 'ASSIGNED') {
            rawList = rawList.filter((c: any) => !!c.assignedUserId || !!c.assignedUserName);
          }
        }

        // CÁLCULO SEGURO Y GARANTIZADO DE PAGINACIÓN
        this.totalElements = res.totalElements !== undefined ? res.totalElements : rawList.length;
        if (res.totalPages && res.totalPages > 0) {
          this.totalPages = res.totalPages;
        } else {
          this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
        }

        this.myAssignedTotal = this.totalElements;

        this.clients = rawList.map((client: any) => ({
          ...client,
          followUpsCount: 0
        }));

        if (this.clients.length === 0) {
          this.inProgressCount = 0;
          this.completedGoalCount = 0;
          this.isLoading = false;
          return;
        }

        // Cargar bitácora
        let loadedCount = 0;
        this.inProgressCount = 0;
        this.completedGoalCount = 0;

        this.clients.forEach(client => {
          this.clientService.getClientAuditLogs(client.id).subscribe({
            next: (logs: any[]) => {
              const count = logs ? logs.length : 0;
              client.followUpsCount = count;

              if (count >= 3) {
                this.completedGoalCount++;
              } else if (count > 0) {
                this.inProgressCount++;
              }

              loadedCount++;
              if (loadedCount === this.clients.length) {
                this.isLoading = false;
              }
            },
            error: () => {
              loadedCount++;
              if (loadedCount === this.clients.length) {
                this.isLoading = false;
              }
            }
          });
        });
      },
      error: (err: any) => {
        console.error('Error al obtener clientes:', err);
        this.isLoading = false;
      }
    });
  }

  openFollowUpModal(client: any): void {
    this.selectedClientForTools = client;
    this.contactMethod = 'WHATSAPP';
    this.followUpStatus = 'INTERESADO';
    this.followUpComments = '';
    this.showToolsModal = true;
    this.loadClientHistory(client.id);
  }

  loadClientHistory(clientId: number): void {
    this.isLoadingHistory = true;
    this.clientFollowUpsHistory = [];

    this.clientService.getClientAuditLogs(clientId).subscribe({
      next: (logs: any[]) => {
        this.clientFollowUpsHistory = logs || [];
        this.isLoadingHistory = false;
      },
      error: (err: any) => {
        console.error('Error al cargar historial:', err);
        this.isLoadingHistory = false;
      }
    });
  }

  sendInventoryWhatsApp(client: any): void {
    const phone = client?.contactPhone || client?.telefono1 || client?.telefono2;
    if (!phone) {
      Swal.fire('Atención', 'El cliente no cuenta con número telefónico registrado.', 'warning');
      return;
    }

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 10) cleanPhone = '52' + cleanPhone;

    const clientName = client?.companyName || client?.nombreDelCliente || 'Estimado cliente';
    const message = `Hola ${clientName}, le saludamos de Toyota Pachuca. 🚗✨\n\nQuedo a sus órdenes para agendar su prueba de manejo o responder cualquier duda.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');
  }

  saveFollowUpLog(): void {
    if (!this.selectedClientForTools) return;

    if (!this.followUpComments.trim()) {
      Swal.fire('Atención', 'Por favor ingresa un comentario sobre la conversación.', 'warning');
      return;
    }

    const payload = {
      contactMethod: this.contactMethod,
      comments: `[${this.followUpStatus}] ${this.followUpComments}`
    };

    this.clientService.addFollowUp(this.selectedClientForTools.id, payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Bitácora Registrada!',
          text: 'Se sumó la interacción al historial del cliente.',
          timer: 1800,
          showConfirmButton: false
        });

        this.followUpComments = '';
        this.loadClientHistory(this.selectedClientForTools.id);
        this.fetchClients();
      },
      error: (err: any) => {
        console.error('Error al guardar bitácora:', err);
        Swal.fire('Error', 'No fue posible registrar la bitácora.', 'error');
      }
    });
  }

  openClientDetailModal(client: any): void {
    if (!client) return;

    const isAssigned = !!(client.assignedUserId || client.assignedUserName);

    this.selectedClientForDetail = {
      ...client,
      companyName: client.companyName || client.nombreDelCliente || 'SIN RAZÓN SOCIAL',
      contactEmail: client.contactEmail || client.email || 'Sin correo registrado',
      contactPhone: client.contactPhone || client.telefono1 || 'Sin teléfono principal',
      secondaryPhone: client.telefono2 || client.telefono3 || null,
      vehicleModel: client.vehicleModel || client.vehiculoComprado || 'No especificado',
      dealership: client.dealership || client.dealer || 'TOYOTA PACHUCA',
      taxId: client.taxId || client.rfc || client.noDeCte || 'N/A',
      calle: client.calle || 'No registrada',
      colonia: client.colonia || 'No registrada',
      municipio: client.municipio || client.sucursal || 'PACHUCA',
      estadoRepublica: client.estadoRepublica || 'HIDALGO',
      cp: client.cp || client.cvesucurs || '42000',
      operationType: client.operationType || client.tipoDeCredito || 'CONTADO / CRÉDITO',
      isAssigned: isAssigned,
      assignmentStatusText: isAssigned ? 'ASIGNADO EN ATENCIÓN' : 'DISPONIBLE SIN ASIGNAR'
    };

    this.showDetailModal = true;
    this.loadClientHistory(client.id);
  }

  closeClientDetailModal(): void {
    this.showDetailModal = false;
    this.selectedClientForDetail = null;
  }

  onAssignAgent(client: any, event: any): void {
    const newUserId = Number(event.target.value);
    
    if (newUserId === 0) {
      this.unassignClient(client);
      return;
    }

    const actor = this.authService.getCurrentUser()?.fullName || 'Administrador';

    this.clientService.assignClientToUser(client.id, newUserId, actor).subscribe({
      next: () => {
        client.assignedUserId = newUserId;
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Asesor actualizado correctamente',
          showConfirmButton: false,
          timer: 1800
        });
        this.fetchClients();
        if (this.isAdmin) this.loadMetrics();
      },
      error: (err: any) => {
        console.error('Error al reasignar cliente:', err);
        Swal.fire('Error', 'No se pudo actualizar la asignación.', 'error');
        this.fetchClients();
      }
    });
  }

  unassignClient(client: any): void {
    const actor = this.authService.getCurrentUser()?.fullName || 'Administrador';

    Swal.fire({
      title: '¿Liberar cliente?',
      text: `El cliente ${client.companyName || client.nombreDelCliente} volverá a estar disponible en la bolsa corporativa sin asignar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.unassignClient(client.id, actor).subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Cliente liberado a la bolsa sin asignar',
              showConfirmButton: false,
              timer: 1800
            });
            this.fetchClients();
            if (this.isAdmin) this.loadMetrics();
          },
          error: (err: any) => {
            console.error('Error al liberar cliente:', err);
            Swal.fire('Error', 'No fue posible desasignar el cliente.', 'error');
            this.fetchClients();
          }
        });
      } else {
        this.fetchClients();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const actor = this.authService.getCurrentUser()?.fullName || 'Administrador';
      Swal.fire({ title: 'Procesando Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      this.clientService.uploadExcel(file, actor).subscribe({
        next: (res: any) => {
          Swal.fire('¡Éxito!', `Se importaron ${res.importedCount || 0} registros correctamente.`, 'success');
          if (this.isAdmin) this.loadMetrics();
          this.fetchClients();
        },
        error: (err: any) => {
          console.error('Error en carga Excel:', err);
          Swal.fire('Error', 'No se pudo procesar el archivo Excel.', 'error');
        }
      });
    }
  }

  openDeleteModal(client: any): void {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: `Se eliminará la cuenta ${client.companyName || client.nombreDelCliente} permanentemente de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.deleteClient(client.id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Cliente eliminado de la base de datos.', 'success');
            this.fetchClients();
            if (this.isAdmin) this.loadMetrics();
          },
          error: (err: any) => {
            console.error('Error al eliminar cliente:', err);
            Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error');
          }
        });
      }
    });
  }

  onTypeChange(type: string): void {
    this.selectedType = type;
    this.currentPage = 0;
    this.fetchClients();
  }

  onAssignmentStatusChange(status: string): void {
    this.assignmentStatusFilter = status;
    this.currentPage = 0;
    this.fetchClients();
  }

  onSearchInput(event: any): void {
    this.searchQuery = event.target.value;
    this.currentPage = 0;
    this.fetchClients();
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.currentPage = newPage;
      this.fetchClients();
    }
  }
}