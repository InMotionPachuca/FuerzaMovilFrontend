package com.fuerzaMovil.dto;

import com.fuerzaMovil.model.UserRole;

public record UserResponseDTO(
        Long id,
        String fullName,
        String username,
        UserRole role
) {}