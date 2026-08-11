package com.fuerzaMovil.dto;

import java.time.LocalDateTime;

public record ClientResponseDTO(
        Long id,
        String companyName,
        String contactEmail,
        String contactPhone,
        String sensitiveNotes,
        String taxId,
        Long assignedUserId,
        String assignedUserName,
        LocalDateTime createdAt
) {}