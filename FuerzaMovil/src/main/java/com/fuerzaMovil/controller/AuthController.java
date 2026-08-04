package com.fuerzaMovil.controller;

import com.fuerzaMovil.dto.AuthRequest;
import com.fuerzaMovil.dto.AuthResponse;
import com.fuerzaMovil.dto.RegisterUserRequest;
import com.fuerzaMovil.dto.UserResponseDTO;
import com.fuerzaMovil.service.AuthService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint público
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Endpoint restringido a ADMINISTRADORES
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> register(@RequestBody RegisterUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // Endpoint restringido a ADMINISTRADORES (Lista todos los usuarios para seleccionar en el frontend)
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}