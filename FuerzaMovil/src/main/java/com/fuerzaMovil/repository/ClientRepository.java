package com.fuerzaMovil.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fuerzaMovil.model.Client;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    
    // Obtiene únicamente los clientes asignados a un usuario específico (Agente)
    List<Client> findByAssignedUserId(Long userId);

    // Valida que el cliente pertenezca al usuario antes de devolverlo
    Optional<Client> findByIdAndAssignedUserId(Long id, Long userId);
}