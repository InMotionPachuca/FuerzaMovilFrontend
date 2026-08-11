package com.fuerzaMovil.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fuerzaMovil.dto.ClientResponseDTO;
import com.fuerzaMovil.dto.CreateClientRequest;
import com.fuerzaMovil.model.Client;
import com.fuerzaMovil.model.User;
import com.fuerzaMovil.model.UserRole;
import com.fuerzaMovil.repository.ClientRepository;
import com.fuerzaMovil.repository.UserRepository;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public ClientService(ClientRepository clientRepository, UserRepository userRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
    }

    // 1. Obtener lista de clientes según el rol
    @Transactional(readOnly = true)
    public List<ClientResponseDTO> getClientsForUser(User currentUser) {
        List<Client> clients;

        if (currentUser.getRole() == UserRole.ADMIN) {
            // El ADMIN puede ver todos los clientes de la agencia
            clients = clientRepository.findAll();
        } else {
            // El AGENTE solo ve los clientes asignados directamente a su ID
            clients = clientRepository.findByAssignedUserId(currentUser.getId());
        }

        return clients.stream().map(this::mapToDTO).toList();
    }

    // 2. Obtener detalle de un cliente específico (Validación estricta de propiedad)
    @Transactional(readOnly = true)
    public ClientResponseDTO getClientById(Long clientId, User currentUser) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + clientId));

        // Si no es ADMIN y el cliente no le pertenece, se rechaza el acceso
        if (currentUser.getRole() != UserRole.ADMIN && !client.getAssignedUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("No tienes permiso para acceder a la información de este cliente.");
        }

        return mapToDTO(client);
    }

    // 3. Crear cliente (Solo ADMIN o según tu flujo de negocio)
    @Transactional
    public ClientResponseDTO createClient(CreateClientRequest request, User currentUser) {
        User assignedUser = null;

        if (request.assignedUserId() != null) {
            assignedUser = userRepository.findById(request.assignedUserId())
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no encontrado"));
        } else if (currentUser.getRole() == UserRole.AGENT) {
            // Si lo crea un agente, se le asigna a sí mismo automáticamente
            assignedUser = currentUser;
        }

        Client client = new Client(
                request.companyName(),
                request.contactEmail(),
                request.contactPhone(),
                request.sensitiveNotes(),
                request.taxId(),
                assignedUser
        );

        return mapToDTO(clientRepository.save(client));
    }

    // 4. Asignar o Reasignar cliente a un agente (Solo ADMIN)
    @Transactional
    public ClientResponseDTO assignClientToUser(Long clientId, Long targetUserId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + targetUserId));

        client.setAssignedUser(targetUser);
        return mapToDTO(clientRepository.save(client));
    }

    // Mapeador de Entidad a DTO
    private ClientResponseDTO mapToDTO(Client client) {
        Long assignedId = client.getAssignedUser() != null ? client.getAssignedUser().getId() : null;
        String assignedName = client.getAssignedUser() != null ? client.getAssignedUser().getFullName() : "Sin asignar";

        return new ClientResponseDTO(
                client.getId(),
                client.getCompanyName(),
                client.getContactEmail(),
                client.getContactPhone(),
                client.getSensitiveNotes(),
                client.getTaxId(),
                assignedId,
                assignedName,
                client.getCreatedAt()
        );
    }
}