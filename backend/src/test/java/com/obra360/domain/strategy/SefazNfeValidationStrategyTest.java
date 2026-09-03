package com.obra360.domain.strategy;

import com.obra360.domain.valueobject.NfeKey;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários: SefazNfeValidationStrategy (Strategy Pattern)")
class SefazNfeValidationStrategyTest {

    private final SefazNfeValidationStrategy strategy = new SefazNfeValidationStrategy();

    @Test
    @DisplayName("Deve validar chave NFe com 44 dígitos numéricos")
    void shouldValidate44DigitNfeKey() {
        NfeKey validKey = new NfeKey("35260912345678000190550010000001231456789012");
        assertTrue(strategy.validate(validKey));
    }

    @Test
    @DisplayName("Deve retornar nome descritivo da estratégia SEFAZ")
    void shouldReturnStrategyName() {
        assertNotNull(strategy.getStrategyName());
        assertTrue(strategy.getStrategyName().contains("SEFAZ"));
    }
}
