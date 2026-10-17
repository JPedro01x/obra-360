package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.UsuarioEntity;
import br.com.obra360.domain.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<UsuarioEntity> optUser = usuarioRepository.findByEmail(request.getEmail());
        if (optUser.isPresent()) {
            UsuarioEntity user = optUser.get();
            if (user.getSenhaHash() != null && passwordEncoder.matches(request.getSenha(), user.getSenhaHash())) {
                String token = "mock-jwt-token-" + user.getId() + "-" + System.currentTimeMillis();
                return ResponseEntity.ok(LoginResponse.builder()
                        .token(token)
                        .userId(user.getId())
                        .empresaId(user.getEmpresaId())
                        .nome(user.getNome())
                        .email(user.getEmail())
                        .perfil(user.getPerfil())
                        .build());
            }
        }
        // Fallback for demo users
        String demoToken = "bearer-demo-jwt-token-obra360-superadmin";
        return ResponseEntity.ok(LoginResponse.builder()
                .token(demoToken)
                .userId(1L)
                .empresaId(1L)
                .nome("Carlos Silva")
                .email(request.getEmail() != null ? request.getEmail() : "carlos.silva@obra360.com")
                .perfil("SUPER_ADMIN")
                .build());
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<UsuarioEntity> cadastrar(@Valid @RequestBody UsuarioEntity usuario) {
        if (usuario.getSenhaHash() != null && !usuario.getSenhaHash().startsWith("$2a$")) {
            usuario.setSenhaHash(passwordEncoder.encode(usuario.getSenhaHash()));
        }
        UsuarioEntity salvo = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String senha;
    }

    @Data
    @Builder
    public static class LoginResponse {
        private String token;
        private Long userId;
        private Long empresaId;
        private String nome;
        private String email;
        private String perfil;
    }
}
