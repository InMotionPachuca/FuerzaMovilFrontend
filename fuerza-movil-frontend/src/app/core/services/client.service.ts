import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Client {
  id?: number;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  sensitiveNotes?: string;
  taxId: string;
  assignedUserId?: number;
  assignedUserName?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/clients';

  // Obtener la lista de clientes (Filtrado automáticamente en el backend según el rol/token)
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  // Crear un nuevo cliente
  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  // Asignar cliente a un agente (Solo ADMIN)
  assignClient(clientId: number, agentId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${clientId}/assign/${agentId}`, {});
  }
}