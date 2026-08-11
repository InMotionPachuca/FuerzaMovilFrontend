import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AgentService, Agent } from '../../core/services/agent.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private agentService = inject(AgentService);

  activeTab: 'users' | 'rules' | 'whatsapp' = 'users';
  roleFilter: 'ALL' | 'ADMIN' | 'AGENT' = 'ALL';

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

  batchSizeBase = 5;
  batchSizeBenefit = 5;

  welcomeTemplate = 'Hola {nombre}, le saludamos de Toyota Pachuca. Nos ponemos a sus órdenes para brindarle atención personalizada sobre su cuenta.';
  followupTemplate = 'Hola {nombre}, le escribimos de Toyota Pachuca para dar seguimiento a nuestra conversación previa sobre su vehículo.';

  get filteredUsers(): Agent[] {
    if (this.roleFilter === 'ALL') return this.users;
    return this.users.filter(u => u.role === this.roleFilter);
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'ADMIN').length;
  }

  get agentCount(): number {
    return this.users.filter(u => u.role === 'AGENT').length;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.agentService.getAgents().subscribe({
      next: (data) => {
        this.users = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.isLoading = false;
      }
    });
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
      role: user.role || 'AGENT'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSaveUser(): void {
    if (!this.userForm.fullName || !this.userForm.username) {
      Swal.fire('Campos Incompletos', 'Por favor llena el nombre y correo/usuario.', 'warning');
      return;
    }

    if (!this.isEditing && !this.userForm.password) {
      Swal.fire('Contraseña Requerida', 'Ingresa una contraseña para la nueva cuenta.', 'warning');
      return;
    }

    Swal.fire({
      title: this.isEditing ? 'Guardando en BD...' : 'Registrando en BD...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const payload: Agent = {
      fullName: this.userForm.fullName,
      username: this.userForm.username,
      role: this.userForm.role
    };

    if (this.userForm.password) {
      payload.password = this.userForm.password;
    }

    if (this.isEditing && this.userForm.id) {
      this.agentService.updateAgent(this.userForm.id, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Actualizado!',
            text: `Se guardaron los cambios en la BD para ${this.userForm.fullName}.`,
            confirmButtonColor: '#EB0A1E'
          });
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          Swal.fire('Error', 'No se pudo actualizar el usuario en la Base de Datos.', 'error');
        }
      });
    } else {
      this.agentService.createAgent(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Registrado!',
            text: `Se creó el usuario ${this.userForm.fullName} en la Base de Datos.`,
            confirmButtonColor: '#EB0A1E'
          });
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          Swal.fire('Error', 'No se pudo crear el usuario en la Base de Datos.', 'error');
        }
      });
    }
  }

  onDeleteUser(user: Agent): void {
    if (!user.id) return;

    Swal.fire({
      title: '¿Eliminar Usuario?',
      text: `Se desasociarán sus clientes y se eliminará a ${user.fullName} de la Base de Datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB0A1E',
      cancelButtonColor: '#222222',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.agentService.deleteAgent(user.id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Usuario removido con éxito.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire('Error', 'No se pudo eliminar el usuario de la Base de Datos.', 'error');
          }
        });
      }
    });
  }

  saveRules(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Reglas de asignación actualizadas',
      showConfirmButton: false,
      timer: 2000
    });
  }

  saveTemplates(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Plantillas de WhatsApp guardadas',
      showConfirmButton: false,
      timer: 2000
    });
  }
}