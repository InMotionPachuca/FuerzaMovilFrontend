import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserDTO, RegisterRequest } from '../../core/services/auth.service';
import { ClientService, Client } from '../../core/services/client.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private authService = inject(AuthService);
  private clientService = inject(ClientService);
  private router = inject(Router);

  users: UserDTO[] = [];
  clients: Client[] = [];

  showUserModal: boolean = false;
  showAssignModal: boolean = false;

  selectedClientId: number | null = null;
  selectedAgentId: number | null = null;

  newUser: RegisterRequest = {
    fullName: '',
    username: '',
    password: '',
    role: 'AGENT'
  };

  message: string = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.authService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: (err: any) => console.error('Error al cargar usuarios:', err)
    });

    this.clientService.getClients().subscribe({
      next: (data) => this.clients = data,
      error: (err: any) => console.error('Error al cargar clientes:', err)
    });
  }

  onRegisterUser(): void {
    if (!this.newUser.fullName || !this.newUser.username || !this.newUser.password) return;

    this.authService.registerUser(this.newUser).subscribe({
      next: () => {
        this.showUserModal = false;
        this.resetUserForm();
        this.loadData();
        this.message = 'Usuario creado con éxito.';
      },
      error: (err: any) => {
        console.error('Detalles del error HTTP:', err.status, err.error);
        this.message = `Error al registrar: ${err.error?.message || err.statusText || 'Error de conexión'}`;
      }
    });
  }

  openAssignModal(clientId: number): void {
    this.selectedClientId = clientId;
    this.showAssignModal = true;
  }

  onAssignClient(): void {
    if (!this.selectedClientId || !this.selectedAgentId) return;

    this.clientService.assignClient(this.selectedClientId, this.selectedAgentId).subscribe({
      next: () => {
        this.showAssignModal = false;
        this.selectedClientId = null;
        this.selectedAgentId = null;
        this.loadData();
        this.message = 'Cliente asignado correctamente.';
      },
      error: (err: any) => console.error('Error al asignar cliente:', err)
    });
  }

  goToClients(): void {
    this.router.navigate(['/clients']);
  }

  private resetUserForm(): void {
    this.newUser = { fullName: '', username: '', password: '', role: 'AGENT' };
  }
}