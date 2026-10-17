package br.com.obra360.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BruteForceProtectionServiceTest {

    private BruteForceProtectionService service;

    @BeforeEach
    void setUp() {
        service = new BruteForceProtectionService();
    }

    @Test
    @DisplayName("Deve bloquear IP após 5 tentativas de login com falha")
    void deveBloquearIpAposCincoFalhas() {
        String ipTest = "192.168.1.100";

        assertFalse(service.isIpBloqueado(ipTest));

        for (int i = 0; i < 4; i++) {
            service.registrarFalhaLogin(ipTest);
            assertFalse(service.isIpBloqueado(ipTest));
        }

        // Quinta tentativa falha
        service.registrarFalhaLogin(ipTest);
        assertTrue(service.isIpBloqueado(ipTest));
    }

    @Test
    @DisplayName("Deve limpar histórico de falhas em caso de sucesso no login")
    void deveLimparFalhasAoLogarComSucesso() {
        String ipTest = "192.168.1.200";

        for (int i = 0; i < 3; i++) {
            service.registrarFalhaLogin(ipTest);
        }

        service.registrarSucessoLogin(ipTest);
        assertFalse(service.isIpBloqueado(ipTest));
    }
}
