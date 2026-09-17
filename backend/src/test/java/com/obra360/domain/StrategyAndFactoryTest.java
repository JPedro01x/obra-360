package com.obra360.domain;

import com.obra360.domain.builder.ConstructionOccurrenceBuilder;
import com.obra360.domain.entity.ConstructionOccurrence;
import com.obra360.domain.factory.OccurrenceFactory;
import com.obra360.domain.strategy.SintegraNfeValidationStrategy;
import com.obra360.domain.valueobject.NfeKey;
import com.obra360.infrastructure.security.RateLimiterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UNIT TESTS FOR GOF DESIGN PATTERNS & SECURITY RATE LIMITER
 */
class StrategyAndFactoryTest {

    @Test
    @DisplayName("Factory: Deve criar ocorrência de Segurança NR-18 com severidade ALTA e atribuição correta")
    void shouldCreateSafetyOccurrenceWithAltaSeverity() {
        ConstructionOccurrence occurrence = OccurrenceFactory.createSafetyOccurrence(
                "PRJ-101",
                "Falta de cinto de segurança no andar 5",
                "Operador trabalhando em altura sem equipamento adequado",
                "Técnico João"
        );

        assertNotNull(occurrence);
        assertTrue(occurrence.getId().startsWith("OCC-NR18-"));
        assertEquals("PRJ-101", occurrence.getProjectId());
        assertEquals("Falta de cinto de segurança no andar 5", occurrence.getTitle());
        assertEquals("Segurança NR-18", occurrence.getCategory());
        assertEquals("ALTA", occurrence.getSeverity());
        assertEquals("Técnico de Segurança do Trabalho", occurrence.getAssignedTo());
        assertTrue(occurrence.isHasPhoto());
    }

    @Test
    @DisplayName("Factory: Deve criar ocorrência de Qualidade ISO 9001 com severidade configurável")
    void shouldCreateIso9001QualityOccurrence() {
        ConstructionOccurrence occurrence = OccurrenceFactory.createIso9001QualityOccurrence(
                "PRJ-102",
                "Fissura em viga V-12",
                "MEDIA",
                "Fissura identificada após desforma da estrutura",
                "Engenheira Maria"
        );

        assertNotNull(occurrence);
        assertTrue(occurrence.getId().startsWith("OCC-ISO-"));
        assertEquals("Não Conformidade ISO 9001", occurrence.getCategory());
        assertEquals("MEDIA", occurrence.getSeverity());
        assertEquals("Engenheiro de Qualidade", occurrence.getAssignedTo());
    }

    @Test
    @DisplayName("Builder: Deve construir ocorrência de forma fluente e consistente")
    void shouldBuildConstructionOccurrenceFluently() {
        ConstructionOccurrence occurrence = new ConstructionOccurrenceBuilder()
                .id("OCC-CUSTOM-001")
                .projectId("PRJ-999")
                .title("Teste Builder")
                .category("Ambiente")
                .severity("BAIXA")
                .description("Descrição do teste")
                .assignedTo("Responsável Teste")
                .reportedBy("Reporter Teste")
                .status("CONCLUIDO")
                .hasPhoto(false)
                .build();

        assertEquals("OCC-CUSTOM-001", occurrence.getId());
        assertEquals("PRJ-999", occurrence.getProjectId());
        assertEquals("Teste Builder", occurrence.getTitle());
        assertEquals("Ambiente", occurrence.getCategory());
        assertEquals("BAIXA", occurrence.getSeverity());
        assertEquals("CONCLUIDO", occurrence.getStatus());
        assertFalse(occurrence.isHasPhoto());
    }

    @Test
    @DisplayName("Strategy: Deve validar chave NFe com formato SINTEGRA")
    void shouldValidateSintegraNfeKey() {
        SintegraNfeValidationStrategy strategy = new SintegraNfeValidationStrategy();

        // Chave válida (44 dígitos, UF SP=35)
        NfeKey validKey = new NfeKey("35230912345678000195550010000000011234567890");
        assertTrue(strategy.validate(validKey));

        // Chave inválida (tamanho incorreto lança IllegalArgumentException no VO)
        assertThrows(IllegalArgumentException.class, () -> new NfeKey("35230912345678"));

        // Chave com código UF inválido (UF 99 fora do intervalo 11..53)
        NfeKey invalidUfKey = new NfeKey("99230912345678000195550010000000011234567890");
        assertFalse(strategy.validate(invalidUfKey));

        // Nulo
        assertFalse(strategy.validate(null));
        assertThrows(IllegalArgumentException.class, () -> new NfeKey(null));

        assertEquals("SINTEGRA Regional Tax Validation Strategy", strategy.getStrategyName());
    }

    @Test
    @DisplayName("RateLimiter: Deve permitir até 10 requisições por minuto e bloquear a 11ª")
    void shouldEnforceRateLimitationPerClientIp() {
        RateLimiterService rateLimiter = new RateLimiterService();
        String clientIp = "192.168.1.100";

        for (int i = 1; i <= 10; i++) {
            assertTrue(rateLimiter.isAllowed(clientIp), "Requisição " + i + " deveria ser permitida");
        }

        // 11ª requisição deve ser bloqueada
        assertFalse(rateLimiter.isAllowed(clientIp), "11ª requisição deveria ser bloqueada pelo Rate Limiter");

        // Outro IP deve continuar permitido
        assertTrue(rateLimiter.isAllowed("192.168.1.101"), "Requisição de outro IP deveria ser permitida");
    }
}
