package com.obra360.infrastructure.controller;

import com.obra360.application.dto.AuthDTOs;
import com.obra360.application.usecase.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import com.obra360.infrastructure.security.RateLimiterService;
import com.obra360.infrastructure.security.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (REST CONTROLLER)
 * Endpoints REST para autenticação JWT e registro de usuários corporativos
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação & Segurança", description = "Endpoints de login JWT, cadastro corporativo e perfil de usuário")
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;

    public AuthController(AuthService authService, RateLimiterService rateLimiterService) {
        this.authService = authService;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuário e emitir token JWT", description = "Valida o e-mail e senha informados, emitindo o Bearer Token JWT para acesso às APIs seguras.")
    public ResponseEntity<AuthDTOs.AuthResponseDTO> login(@Valid @RequestBody AuthDTOs.LoginRequestDTO request, HttpServletRequest httpRequest) {
        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        if (!rateLimiterService.isAllowed(clientIp)) {
            throw new RateLimitExceededException("Limite de tentativas de login excedido. Tente novamente em 1 minuto.");
        }
        AuthDTOs.AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastrar novo usuário corporativo", description = "Registra um novo usuário no banco de dados com senha criptografada em BCrypt e retorna o Bearer Token JWT inicial.")
    public ResponseEntity<AuthDTOs.AuthResponseDTO> register(@Valid @RequestBody AuthDTOs.RegisterRequestDTO request) {
        AuthDTOs.AuthResponseDTO response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Obter dados do usuário autenticado", description = "Retorna os detalhes do perfil do usuário associado ao Token JWT enviado no cabeçalho Authorization.")
    public ResponseEntity<AuthDTOs.UserProfileDTO> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        AuthDTOs.UserProfileDTO userProfile = authService.getCurrentUser(email);
        return ResponseEntity.ok(userProfile);
    }
}
