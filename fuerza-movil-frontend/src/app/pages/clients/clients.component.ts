import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, Client } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  clients: Client[] = [];
  isLoading: boolean = false;
  showModal: boolean = false;

  newClient: Client = {
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    taxId: '',
    sensitiveNotes: ''
  };

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.isLoading = false;
      }
    });
  }

  onCreateClient(): void {
    if (!this.newClient.companyName || !this.newClient.contactEmail) return;

    this.clientService.createClient(this.newClient).subscribe({
      next: () => {
        this.showModal = false;
        this.resetForm();
        this.loadClients(); // Recarga la tabla con el cliente recién creado
      },
      error: (err) => console.error('Error al guardar cliente:', err)
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resetForm(): void {
    this.newClient = { companyName: '', contactEmail: '', contactPhone: '', taxId: '', sensitiveNotes: '' };
  }
}