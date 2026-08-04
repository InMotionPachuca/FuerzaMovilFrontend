package com.fuerzaMovil.dto;

import com.fuerzaMovil.model.UserRole;

public record RegisterUserRequest(
        String fullName,
        String username,
        String password,
        UserRole role
) {}