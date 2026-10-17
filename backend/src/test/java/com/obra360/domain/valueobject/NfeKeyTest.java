package com.obra360.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários de Regra de Negócio: NfeKey Value Object")
class NfeKeyTest {

    @Test
    @DisplayName("Deve aceitar chave NFe válida com exatamente 44 dígitos")
    void shouldAcceptValidNfeKey() {
        String validKey = "35260912345678000190550010000001231456789012";
        NfeKey nfeKey = new NfeKey(validKey);

        assertNotNull(nfeKey);
        assertEquals(validKey, nfeKey.getValue());
    }

    @Test
    @DisplayName("Deve lançar exceção para chave NFe com menos de 44 dígitos")
    void shouldThrowExceptionForInvalidNfeKey() {
        String invalidKey = "123456";
        assertThrows(IllegalArgumentException.class, () -> new NfeKey(invalidKey));
    }
}
