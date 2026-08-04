package com.fuerzaMovil.service;

import com.fuerzaMovil.dto.*;
import com.fuerzaMovil.model.User;
import com.fuerzaMovil.model.UserRole;
import com.fuerzaMovil.repository.UserRepository;
import com.fuerzaMovil.config.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 1. Método para Login existente
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        UserDetails user = userDetailsService.loadUserByUsername(request.username());
        String token = jwtService.generateToken(user);
        
        return new AuthResponse(token);
    }

    // 2. NUEVO: Registrar un nuevo usuario (Agente o Admin)
    public UserResponseDTO register(RegisterUserRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new RuntimeException("El nombre de usuario/email ya está registrado.");
        }

        User user = new User(
                request.fullName(),
                request.username(),
                passwordEncoder.encode(request.password()), // Se guarda encriptado con BCrypt
                request.role() != null ? request.role() : UserRole.AGENT
        );

        User savedUser = userRepository.save(user);
        return new UserResponseDTO(savedUser.getId(), savedUser.getFullName(), savedUser.getUsername(), savedUser.getRole());
    }

    // 3. NUEVO: Listar todos los usuarios creados (Útil para que el Admin los asigne en un desplegable/select)
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponseDTO(u.getId(), u.getFullName(), u.getUsername(), u.getRole()))
                .toList();
    }
}