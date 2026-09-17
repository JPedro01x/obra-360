package com.obra360.infrastructure.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "Obra360EnterpriseSecretKeyWithAtLeast256BitsLengthForHS256AlgorithmSecurity2026";
    private final long expirationMs = 3600000; // 1h

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    @DisplayName("Deve gerar e validar token JWT com sucesso contendo as claims de tenant e RBAC")
    void shouldGenerateAndValidateTokenSuccessfully() {
        String token = tokenProvider.generateToken(
                "USR-101",
                "engenheiro@obra360.com.br",
                "João Pedro Engenheiro",
                "ENGENHEIRO",
                "CMP-001"
        );

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        Claims claims = tokenProvider.getClaimsFromToken(token);
        assertEquals("engenheiro@obra360.com.br", claims.getSubject());
        assertEquals("USR-101", claims.get("userId"));
        assertEquals("João Pedro Engenheiro", claims.get("name"));
        assertEquals("ENGENHEIRO", claims.get("role"));
        assertEquals("CMP-001", claims.get("companyId"));
    }

    @Test
    @DisplayName("Deve rejeitar token JWT inválido ou adulterado")
    void shouldRejectInvalidToken() {
        String invalidToken = "eyJhbGciOiJIUzI1NiJ9.invalidPayload.invalidSignature";
        assertFalse(tokenProvider.validateToken(invalidToken));
    }
}
