package com.fuerzaMovil.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.fuerzaMovil.model.User;
import com.fuerzaMovil.model.UserRole;
import com.fuerzaMovil.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Verifica si ya existen usuarios para evitar duplicados al reiniciar la app
        if (userRepository.findByUsername("admin@agencia.com").isEmpty()) {
            
            User admin = new User(
                    "Administrador Principal",
                    "admin@agencia.com",
                    passwordEncoder.encode("AdminPass123!"), // Encriptación BCrypt
                    UserRole.ADMIN
            );

            userRepository.save(admin);
            System.out.println(">>> [DataInitializer] Usuario Administrador por defecto creado exitosamente.");
            System.out.println(">>> Usuario: admin@agencia.com");
            System.out.println(">>> Contraseña: AdminPass123!");
        }
    }
}