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
  benefitClientsCount = 0;

  // MODOS DE FILTRO: 'UNASSIGNED' (Base), 'BENEFIT', 'ASSIGNED'
  currentFilterMode: 'UNASSIGNED' | 'BENEFIT' | 'ASSIGNED' = 'UNASSIGNED';
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

  get greetingMessage(): string {
    const hour = new Date().getHours();
    let timeGreeting = 'Buenos días';
    if (hour >= 12 && hour < 19) {
      timeGreeting = 'Buenas tardes';
    } else if (hour >= 19 || hour < 6) {
      timeGreeting = 'Buenas noches';
    }

    let name = this.currentUser?.fullName;
    if (!name) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          name = parsed.fullName || parsed.username;
        }
      } catch (e) {
        name = null;
      }
    }

    if (!name) {
      name = this.isAdmin ? 'Administrador Principal' : 'Asesor Comercial';
    }

    return `${timeGreeting}, ${name}`;
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
        this.benefitClientsCount = m.benefit || 0;
      }
    });
  }

  loadClients(): void {
    this.isLoading = true;

    // 1. VISTA DE ASESOR COMERCIAL
    if (!this.isAdmin) {
      const agentId = this.currentUser?.id;
      this.clientService.getClientsPaged(
        'ALL',
        'ASSIGNED',
        this.currentPage,
        this.pageSize,
        agentId,
        'AGENT',
        this.searchQuery
      ).subscribe({
        next: (res: any) => {
          this.clients = res.content || [];
          this.setPaginationData(res);
          this.isLoading = false;
        },
        error: () => {
          this.clients = [];
          this.isLoading = false;
        }
      });
      return;
    }

    // 2. VISTA DE ADMINISTRADOR (BASE, BENEFIT O ASIGNADOS)
    let clientTypeParam: string = 'ALL';
    let assignmentStatusParam: string = this.currentFilterMode;

    if (this.currentFilterMode === 'BENEFIT') {
      clientTypeParam = 'BENEFIT';
      assignmentStatusParam = 'ALL';
    } else if (this.currentFilterMode === 'UNASSIGNED') {
      clientTypeParam = 'BASE';
      assignmentStatusParam = 'UNASSIGNED';
    } else if (this.currentFilterMode === 'ASSIGNED') {
      clientTypeParam = 'ALL';
      assignmentStatusParam = 'ASSIGNED';
    }

    this.clientService.getClientsPaged(
      clientTypeParam,
      assignmentStatusParam,
      this.currentPage,
      this.pageSize,
      undefined,
      'ADMIN',
      this.searchQuery
    ).subscribe({
      next: (res: any) => {
        this.clients = res.content || [];
        this.setPaginationData(res);
        this.isLoading = false;
      },
      error: () => {
        this.clients = [];
        this.isLoading = false;
      }
    });
  }

  private setPaginationData(res: any): void {
    if (res.page) {
      this.totalElements = res.page.totalElements ?? 0;
      this.totalPages = res.page.totalPages ?? 1;
      this.currentPage = res.page.number ?? 0;
    } else {
      this.totalElements = res.totalElements ?? this.clients.length;
      this.totalPages = res.totalPages ?? Math.ceil(this.totalElements / this.pageSize) ?? 1;
    }
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

  isBenefitClient(client: any): boolean {
    if (!client) return false;
    if (client.isBenefit) return true;

    const rawType = String(
      client.clientType || client.operationType || client.tipoDeCredito || client.origen || ''
    ).toUpperCase().trim();

    return rawType.includes('BENEFIT') || rawType.includes('BENEFICIO') || rawType.includes('PREFERENCIAL');
  }

  setFilterMode(mode: 'UNASSIGNED' | 'BENEFIT' | 'ASSIGNED'): void {
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
      text: `El cliente ${client.companyName || client.nombreDelCliente} volverá a la bolsa correspondiente.`,
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
      text: 'Procesando archivo de clientes a beneficios.',
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
    const phone = client?.contactPhone || client?.telefono1 || client?.telefono2;
    if (!phone) {
      Swal.fire('Sin teléfono', 'El cliente no tiene un teléfono registrado.', 'warning');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    const clientName = client.companyName || client.nombreDelCliente || 'Estimado(a) cliente';
    const agentName = this.currentUser?.fullName || 'Su Asesor Comercial';
    const isBenefit = this.isBenefitClient(client);

    let messageText = '';

    if (isBenefit) {
      messageText =
        `Estimado(a) *${clientName}*, le saluda *${agentName}* asesor de ventas de *Toyota & Carsline Pachuca*.\n` +
        `Me pongo en contacto con usted porque cuenta con un *beneficio especial de financiamiento Benefit* para estrenar ` +
        `una nueva unidad con condiciones preferenciales.\n` +
        `¿Le gustaría que le comparta las alternativas disponibles y hagamos una propuesta a su medida?\n` +
        `¡Que tenga un excelente día!\n` +
        `*${agentName} | Toyota & Carsline Pachuca*\n` +
        `*Catálogo:* https://toyotapachuca.com.mx/`;
    } else {
      messageText =
        `Estimado(a) *${clientName}*, le saluda *${agentName}* asesor de ventas de *Toyota & Carsline Pachuca*.\n` +
        `Quiero ponerme a sus órdenes para apoyarle si está pensando en cambiar o renovar su vehículo. \n` +
        `Actualmente contamos con diferentes modelos y promociones disponibles.\n` +
        `¿Le gustaría revisar alternativas?\n` +
        `¡Será un gusto atenderle!\n` +
        `*${agentName} | Toyota & Carsline Pachuca*\n` +
        `*Vehículos Nuevos:* https://toyotapachuca.com.mx/`;
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
      title: '¿Eliminar cliente?',
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