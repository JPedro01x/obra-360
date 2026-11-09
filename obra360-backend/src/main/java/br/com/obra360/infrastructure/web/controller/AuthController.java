package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.UsuarioEntity;
import br.com.obra360.domain.repository.UsuarioRepository;
import br.com.obra360.infrastructure.security.JwtService;
import br.com.obra360.infrastructure.security.TenantContext;
import br.com.obra360.infrastructure.security.BruteForceProtectionService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
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
    private final JwtService jwtService;
    private final BruteForceProtectionService bruteForce;
    private final br.com.obra360.application.service.OperacaoService operation;
    private final br.com.obra360.application.service.MfaService mfa;
    private final br.com.obra360.application.service.LicencaService licenca;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        if (bruteForce.isIpBloqueado(clientIp)) return ResponseEntity.status(429).build();
        Optional<UsuarioEntity> optUser = usuarioRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (optUser.isPresent()) {
            UsuarioEntity user = optUser.get();
            if (Boolean.TRUE.equals(user.getAtivo()) && user.getEmpresaId() != null &&
                (user.getBloqueadoAte() == null || !user.getBloqueadoAte().isAfter(java.time.OffsetDateTime.now())) &&
                user.getSenhaHash() != null && passwordEncoder.matches(request.getSenha(), user.getSenhaHash()) &&
                (request.getPerfil()==null || request.getPerfil().isBlank() || user.getPerfil().equals(request.getPerfil()))) {
                String code = request.getCodigo();
                if (!mfa.verify(user.getId(), code)) {
                    if (code == null || code.isBlank()) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .cacheControl(CacheControl.noStore())
                                .body(Map.of("code", "MFA_REQUIRED", "detail", "Informe o código de duas etapas."));
                    }
                    bruteForce.registrarFalhaLogin(clientIp);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .cacheControl(CacheControl.noStore())
                            .body(Map.of("code", "MFA_INVALID", "detail", "Código inválido ou já utilizado."));
                }
                String token = jwtService.issue(user);
                bruteForce.registrarSucessoLogin(clientIp);
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
        bruteForce.registrarFalhaLogin(clientIp);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Credenciais inválidas."));
    }

    @PostMapping("/cadastrar")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<UsuarioEntity> cadastrar(@Valid @RequestBody UsuarioEntity usuario) {
        if (usuario.getSenhaHash() == null || usuario.getSenhaHash().length() < 12 || usuario.getSenhaHash().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72 ||
            usuario.getNome() == null || usuario.getNome().isBlank() ||
            usuario.getEmail() == null || !usuario.getEmail().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") ||
            usuario.getPerfil() == null || !java.util.Set.of("SUPER_ADMIN", "RH", "GERENTE_OBRA", "ENGENHEIRO", "MESTRE_OBRA", "ALMOXARIFE", "FINANCEIRO", "AUDITOR", "ARQUITETO", "INCORPORADOR", "CLIENTE", "FORNECEDOR", "LOCADOR_MAQUINAS", "CORRETOR", "INVESTIDOR").contains(usuario.getPerfil())) {
            return ResponseEntity.badRequest().build();
        }
        if(!Boolean.FALSE.equals(usuario.getAtivo()))licenca.user(TenantContext.getCurrentTenant(),false);
        usuario.setId(null);
        usuario.setVersaoCredencial(0);
        usuario.setGoogleSubject(null);
        usuario.setEmail(usuario.getEmail().trim().toLowerCase(java.util.Locale.ROOT));
        usuario.setEmpresaId(TenantContext.getCurrentTenant());
        usuario.setSenhaHash(passwordEncoder.encode(usuario.getSenhaHash()));
        usuario.setBloqueadoAte(null);
        usuario.setTentativasLoginFalhas(0);
        usuario.setDataCriacao(null);
        UsuarioEntity salvo = usuarioRepository.save(usuario);
        var actor=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        operation.audit("CRIAR_USUARIO","usuario",salvo.getId(),Long.valueOf(actor.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        @jakarta.validation.constraints.Size(max=200)
        private String senha;
        @jakarta.validation.constraints.Size(max=64)
        private String codigo;
        @jakarta.validation.constraints.Size(max=30)
        private String perfil;
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
