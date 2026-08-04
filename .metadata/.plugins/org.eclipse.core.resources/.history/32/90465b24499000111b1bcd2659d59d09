package com.fuerzaMovil.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.fuerzaMovil.dto.ClientResponseDTO;
import com.fuerzaMovil.dto.CreateClientRequest;
import com.fuerzaMovil.model.User;
import com.fuerzaMovil.service.ClientService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // GET /api/v1/clients -> Retorna solo los clientes permitidos para el usuario
    @GetMapping
    public ResponseEntity<List<ClientResponseDTO>> getMyClients(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(clientService.getClientsForUser(currentUser));
    }

    // GET /api/v1/clients/{id} -> Revisa si el usuario tiene acceso al cliente ID
    @GetMapping("/{id}")
    public ResponseEntity<ClientResponseDTO> getClientById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(clientService.getClientById(id, currentUser));
    }

    // POST /api/v1/clients -> Crear un nuevo cliente
    @PostMapping
    public ResponseEntity<ClientResponseDTO> createClient(
            @RequestBody CreateClientRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.createClient(request, currentUser));
    }

    // PUT /api/v1/clients/{id}/assign/{userId} -> Exclusivo para Administradores
    @PutMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClientResponseDTO> assignClient(
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(clientService.assignClientToUser(id, userId));
    }
}