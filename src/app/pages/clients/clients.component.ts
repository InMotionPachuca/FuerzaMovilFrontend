import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ClientService } from '../../core/services/client.service';
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

  // MÉTRICAS PERSONALIZADAS
  summaryTotalPortfolio = 0;
  assignedToMeCount = 0;
  pendingFollowUpsCount = 0;
  completedFollowUpsCount = 0;

  currentFilterMode: 'UNASSIGNED' | 'ASSIGNED' = 'ASSIGNED';
  isAdmin = false;
  currentUser: any = null;

  clients: any[] = [];
  agents: any[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  searchQuery = '';
  isLoading = false;

  showToolsModal = false;
  selectedClientForTools: any = null;
  clientFollowUpsHistory: any[] = [];
  isLoadingHistory = false;
  contactMethod = 'WhatsApp';
  followUpStatus = 'Interesado en Auto Nuevo / Seminuevo';
  followUpComments = '';

  showDetailModal = false;
  selectedClientForDetail: any = null;

  ngOnInit(): void {
    this.checkUserRole();
    this.loadInitialData();
  }

  checkUserRole(): void {
    this.currentUser = this.authService.getCurrentUser();
    const role = String(this.currentUser?.role || '').toUpperCase();
    this.isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
    this.currentFilterMode = this.isAdmin ? 'UNASSIGNED' : 'ASSIGNED';
  }

  loadInitialData(): void {
    if (this.isAdmin) {
      this.loadSummaryMetricsGlobal();
      this.loadAgentsList();
    }
    this.loadClients();
  }

  loadSummaryMetricsGlobal(): void {
    this.clientService.getSummaryMetrics().subscribe({
      next: (m: any) => {
        this.summaryTotalPortfolio = m.total || 0;
        this.assignedToMeCount = (m.total || 0) - (m.unassigned || 0);
        this.pendingFollowUpsCount = m.unassigned || 0;
        this.completedFollowUpsCount = m.base || 0;
      }
    });
  }

  loadClients(): void {
    this.isLoading = true;

    // VISTA DE AGENTE COMERCIAL
    if (!this.isAdmin) {
      const agentId = this.currentUser?.id;
      this.clientService.getClientsPaged('ALL', 'ASSIGNED', this.currentPage, this.pageSize, agentId, 'AGENT', this.searchQuery).subscribe({
        next: (res: any) => {
          this.clients = res.content || [];
          this.totalElements = res.totalElements || this.clients.length;
          this.totalPages = res.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1;

          // Calcular métricas personales del asesor
          this.assignedToMeCount = this.totalElements;
          let completed = 0;
          this.clients.forEach(c => {
            if ((c.followUpsCount || 0) >= 3) completed++;
          });
          this.completedFollowUpsCount = completed;
          this.pendingFollowUpsCount = this.totalElements - completed;

          this.isLoading = false;
        },
        error: () => {
          this.clients = [];
          this.isLoading = false;
        }
      });
      return;
    }

    // VISTA ADMINISTRADOR
    const assignmentStatus = this.currentFilterMode === 'ASSIGNED' ? 'ASSIGNED' : 'UNASSIGNED';

    this.clientService.getClientsPaged('ALL', assignmentStatus, this.currentPage, this.pageSize, undefined, 'ADMIN', this.searchQuery).subscribe({
      next: (res: any) => {
        this.clients = res.content || [];
        this.totalElements = res.totalElements || this.clients.length;
        this.totalPages = res.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1;
        this.isLoading = false;
      },
      error: () => {
        this.clients = [];
        this.isLoading = false;
      }
    });
  }

  loadAgentsList(): void {
    this.clientService.getAgents().subscribe({
      next: (users: any[]) => {
        this.agents = (users || []).filter((u: any) =>
          u.role && (u.role === 'AGENT' || u.role === 'ROLE_AGENT' || u.role.name === 'AGENT') &&
          u.username !== 'admin@agencia.com'
        );
      }
    });
  }

  isVipClient(client: any): boolean {
    if (!client) return false;
    if (client.isVip || client.isBenefit) return true;

    const rawType = String(
      client.clientType || client.operationType || client.tipoDeCredito || ''
    ).toUpperCase().trim();

    return ['VIP', 'BENEFIT', 'BENEFICIO', 'BENEFICIOS', 'PREFERENCIAL'].includes(rawType);
  }

  setFilterMode(mode: 'UNASSIGNED' | 'ASSIGNED'): void {
    if (!this.isAdmin) return;
    this.currentFilterMode = mode;
    this.currentPage = 0;
    this.loadClients();
  }

  onSearchInput(event: any): void {
    this.searchQuery = event.target.value;
    this.currentPage = 0;
    this.loadClients();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadClients();
    }
  }

  onAssignAgent(client: any, eventOrUserId: any): void {
    let targetUserIdStr = '';
    if (typeof eventOrUserId === 'string' || typeof eventOrUserId === 'number') {
      targetUserIdStr = String(eventOrUserId);
    } else if (eventOrUserId && eventOrUserId.target) {
      targetUserIdStr = eventOrUserId.target.value;
    }

    const userId = parseInt(targetUserIdStr, 10);
    if (isNaN(userId)) return;

    this.clientService.assignClientToUser(client.id, userId, 'Administrador Principal').subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Cliente Asignado',
          text: 'El cliente se asignó correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadClients();
      },
      error: () => Swal.fire('Error', 'No se pudo asignar el cliente.', 'error')
    });
  }

  unassignClient(client: any): void {
    Swal.fire({
      title: '¿Liberar cliente?',
      text: `El cliente ${client.companyName || client.nombreDelCliente} volverá a la Bolsa Sin Asignar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.unassignClient(client.id, 'Administrador Principal').subscribe({
          next: () => {
            Swal.fire('Liberado', 'El cliente regresó a la bolsa libre.', 'success');
            this.loadClients();
          }
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    Swal.fire({
      title: 'Cargando archivo Excel...',
      text: 'Procesando archivo de clientes.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.clientService.uploadExcel(file, 'Administrador Principal').subscribe({
      next: (res: any) => {
        Swal.fire('¡Éxito!', `Se importaron ${res.importedCount || 0} registros.`, 'success');
        this.loadClients();
      },
      error: () => Swal.fire('Error', 'No se pudo procesar el archivo Excel.', 'error')
    });
  }

  openFollowUpModal(client: any): void {
    this.selectedClientForTools = client;
    this.showToolsModal = true;
    this.followUpComments = '';
    this.loadAuditHistory(client.id);
  }

  loadAuditHistory(clientId: number): void {
    this.isLoadingHistory = true;
    this.clientService.getClientAuditLogs(clientId).subscribe({
      next: (logs: any[]) => {
        this.clientFollowUpsHistory = logs || [];
        this.isLoadingHistory = false;
      },
      error: () => {
        this.clientFollowUpsHistory = [];
        this.isLoadingHistory = false;
      }
    });
  }

  saveFollowUpLog(): void {
    if (!this.selectedClientForTools || !this.followUpComments.trim()) {
      Swal.fire('Atención', 'Por favor escribe observaciones antes de guardar.', 'warning');
      return;
    }

    const payload = {
      contactMethod: this.contactMethod,
      followUpStatus: this.followUpStatus,
      comments: this.followUpComments
    };

    this.clientService.addFollowUp(this.selectedClientForTools.id, payload).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Se registró el avance comercial.', 'success');
        this.loadAuditHistory(this.selectedClientForTools.id);
        this.followUpComments = '';
        this.loadClients();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la interacción.', 'error')
    });
  }

  sendInventoryWhatsApp(client: any): void {
    const phone = client?.contactPhone || client?.telefonoContacto;
    if (!phone) {
      Swal.fire('Sin teléfono', 'El cliente no tiene un teléfono registrado.', 'warning');
      return;
    }

    // Sanitizar teléfono a 10 dígitos limpios
    const cleanPhone = phone.replace(/\D/g, '');
    const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    const clientName = client.companyName || client.nombreDelCliente || 'Estimado(a) cliente';
    const agentName = this.currentUser?.fullName || 'Su Asesor Comercial';
    const vehicleInterest = client.vehicleModel ? ` sobre la unidad *${client.vehicleModel}*` : '';

    // Verificar si es cliente VIP / Beneficios usando nuestro helper
    const isVip = this.isVipClient(client);

    let messageText = '';

    if (isVip) {
      // =========================================================================
      // PLANTILLA 1: CLIENTES DE BENEFICIOS VIP / CARTERA PREFERENCIAL
      // =========================================================================
      messageText =
        `Estimado(a) *${clientName}*, le saluda *${agentName}* asesor de ventas de *Toyota & Carsline Pachuca*.
Me pongo en contacto con usted porque tenemos un *beneficio especial de financiamiento* que podría ayudarle a estrenar
una nueva unidad con condiciones preferenciales.
Me gustaría revisar con usted las opciones disponibles y encontrar la alternativa que mejor se adapte a sus necesidades.
¿Le gustaría que le comparta la información y hagamos una propuesta sin compromiso?
¡Que tenga un excelente día!
*${agentName} | Toyota & Carsline Pachuca*
*Catálogo de Vehículos Nuevos:* https://toyotapachuca.com.mx/
*Inventario de Seminuevos:* https://toyotapachuca.com.mx/Seminuevos/`;



    } else {
      // =========================================================================
      // PLANTILLA 2: CONTACTO NORMAL / CARTERA BASE
      // =========================================================================
      messageText =
        `Estimado(a) *${clientName}*, le saluda *${agentName}* asesor de ventas de *Toyota & Carsline Pachuca*.
Quiero ponerme a sus órdenes para apoyarle si está pensando en cambiar o renovar su vehículo. 
Actualmente contamos con diferentes modelos y opciones que podrían adaptarse a lo que busca.
¿Le gustaría que le comparta algunas opciones y promociones disponibles?
¡Será un gusto atenderle!
*${agentName} | Toyota & Carsline Pachuca*
*Vehículos Nuevos:* https://toyotapachuca.com.mx/
*Inventario de Seminuevos:* https://toyotapachuca.com.mx/Seminuevos/`;
    }

    const encodedMsg = encodeURIComponent(messageText);
    window.open(`https://wa.me/52${tenDigitPhone}?text=${encodedMsg}`, '_blank');
  }
  openClientDetailModal(client: any): void {
    this.selectedClientForDetail = client;
    this.showDetailModal = true;
    this.loadAuditHistory(client.id);
  }

  closeClientDetailModal(): void {
    this.showDetailModal = false;
    this.selectedClientForDetail = null;
  }

  openDeleteModal(client: any): void {
    Swal.fire({
      title: '¿Eliminar cliente permanentemente?',
      text: `Esta acción no se puede deshacer para ${client.companyName || client.nombreDelCliente}.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.deleteClient(client.id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El cliente fue eliminado.', 'success');
            this.loadClients();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error')
        });
      }
    });
  }
}