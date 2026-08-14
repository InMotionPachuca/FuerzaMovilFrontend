import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AgentService, Agent } from '../../core/services/agent.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private agentService = inject(AgentService);
  private authService = inject(AuthService);

  activeTab: 'users' | 'rules' | 'whatsapp' = 'users';
  roleFilter: 'ALL' | 'ADMIN' | 'AGENT' = 'ALL';
  searchTerm = '';

  users: Agent[] = [];
  isLoading = false;
  showModal = false;
  isEditing = false;

  userForm: {
    id?: number;
    fullName: string;
    username: string;
    password?: string;
    role: string;
  } = {
    id: undefined,
    fullName: '',
    username: '',
    password: '',
    role: 'AGENT'
  };

  // Reglas de Lote Masivo (Persistidas)
  batchSizeBase = 10;
  batchSizeBenefit = 5;

  // Plantillas de WhatsApp (Persistidas)
  welcomeTemplate = 'Estimado(a) {nombre}, le saluda {asesor} de Toyota Pachuca. Nos ponemos a sus órdenes para brindarle atención personalizada sobre su cuenta.';
  followupTemplate = 'Estimado(a) {nombre}, le escribe {asesor} de Toyota Pachuca para dar seguimiento a nuestra conversación previa sobre las promociones y opciones para su vehículo.';

  ngOnInit(): void {
    this.loadUsers();
    this.loadSettings();
  }

  // Normalizador de roles seguro
  private normalizeRole(role: any): string {
    const r = String(role || '').toUpperCase().trim();
    if (r.includes('ADMIN')) return 'ADMIN';
    return 'AGENT';
  }

  get filteredUsers(): Agent[] {
    return this.users.filter(u => {
      const normalized = this.normalizeRole(u.role);
      const matchesRole = this.roleFilter === 'ALL' || normalized === this.roleFilter;
      
      const search = this.searchTerm.toLowerCase().trim();
      const matchesSearch = !search || 
        (u.fullName && u.fullName.toLowerCase().includes(search)) ||
        (u.username && u.username.toLowerCase().includes(search));

      return matchesRole && matchesSearch;
    });
  }

  get adminCount(): number {
    return this.users.filter(u => this.normalizeRole(u.role) === 'ADMIN').length;
  }

  get agentCount(): number {
    return this.users.filter(u => this.normalizeRole(u.role) === 'AGENT').length;
  }

  loadUsers(): void {
    this.isLoading = true;
    // Usamos getAllUsers de AuthService para traer la lista completa (Admins + Asesores)
    this.authService.getAllUsers().subscribe({
      next: (data: any[]) => {
        this.users = data || [];
        this.isLoading = false;
      },
      error: () => {
        // Fallback a agentService si fuera necesario
        this.agentService.getAgents().subscribe({
          next: (data) => {
            this.users = data || [];
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al cargar directorio:', err);
            this.isLoading = false;
          }
        });
      }
    });
  }

  loadSettings(): void {
    const savedBatchBase = localStorage.getItem('cfg_batch_base');
    const savedBatchBenefit = localStorage.getItem('cfg_batch_benefit');
    if (savedBatchBase) this.batchSizeBase = parseInt(savedBatchBase, 10);
    if (savedBatchBenefit) this.batchSizeBenefit = parseInt(savedBatchBenefit, 10);

    const savedWelcome = localStorage.getItem('cfg_tpl_welcome');
    const savedFollowup = localStorage.getItem('cfg_tpl_followup');
    if (savedWelcome) this.welcomeTemplate = savedWelcome;
    if (savedFollowup) this.followupTemplate = savedFollowup;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.userForm = {
      id: undefined,
      fullName: '',
      username: '',
      password: '',
      role: 'AGENT'
    };
    this.showModal = true;
  }

  openEditModal(user: Agent): void {
    this.isEditing = true;
    this.userForm = {
      id: user.id,
      fullName: user.fullName || '',
      username: user.username || '',
      password: '',
      role: this.normalizeRole(user.role)
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSaveUser(): void {
    if (!this.userForm.fullName.trim() || !this.userForm.username.trim()) {
      Swal.fire('Campos Incompletos', 'Por favor llena el nombre completo y usuario/correo.', 'warning');
      return;
    }

    if (!this.isEditing && !this.userForm.password?.trim()) {
      Swal.fire('Contraseña Requerida', 'Ingresa una contraseña para la nueva cuenta.', 'warning');
      return;
    }

    Swal.fire({
      title: this.isEditing ? 'Guardando cambios...' : 'Creando usuario...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const payload: Agent = {
      fullName: this.userForm.fullName.trim(),
      username: this.userForm.username.trim(),
      role: this.userForm.role
    };

    if (this.userForm.password?.trim()) {
      payload.password = this.userForm.password.trim();
    }

    if (this.isEditing && this.userForm.id) {
      this.agentService.updateAgent(this.userForm.id, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Usuario Actualizado',
            text: `Se guardaron los datos para ${payload.fullName}.`,
            timer: 1500,
            showConfirmButton: false
          });
          this.closeModal();
          this.loadUsers();
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error')
      });
    } else {
      this.agentService.createAgent(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Creado!',
            text: `Cuenta creada exitosamente para ${payload.fullName}.`,
            timer: 1500,
            showConfirmButton: false
          });
          this.closeModal();
          this.loadUsers();
        },
        error: () => Swal.fire('Error', 'No se pudo registrar el usuario.', 'error')
      });
    }
  }

  onDeleteUser(user: Agent): void {
    if (!user.id) return;

    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Esta acción removerá a ${user.fullName} (${user.username}) del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.agentService.deleteAgent(user.id!).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Usuario removido con éxito.', 'success');
            this.loadUsers();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error')
        });
      }
    });
  }

  saveRules(): void {
    localStorage.setItem('cfg_batch_base', String(this.batchSizeBase));
    localStorage.setItem('cfg_batch_benefit', String(this.batchSizeBenefit));

    Swal.fire({
      icon: 'success',
      title: 'Reglas Guardadas',
      text: 'Los parámetros de asignación diaria fueron actualizados.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  saveTemplates(): void {
    localStorage.setItem('cfg_tpl_welcome', this.welcomeTemplate);
    localStorage.setItem('cfg_tpl_followup', this.followupTemplate);

    Swal.fire({
      icon: 'success',
      title: 'Plantillas Actualizadas',
      text: 'Los mensajes predeterminados para asesores han sido guardados.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  resetTemplates(): void {
    this.welcomeTemplate = 'Estimado(a) {nombre}, le saluda {asesor} de Toyota Pachuca. Nos ponemos a sus órdenes para brindarle atención personalizada sobre su cuenta.';
    this.followupTemplate = 'Estimado(a) {nombre}, le escribe {asesor} de Toyota Pachuca para dar seguimiento a nuestra conversación previa sobre las promociones y opciones para su vehículo.';
    this.saveTemplates();
  }
}