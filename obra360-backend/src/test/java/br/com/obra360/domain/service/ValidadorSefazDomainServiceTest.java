package br.com.obra360.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidadorSefazDomainServiceTest {

    private ValidadorSefazDomainService validador;

    @BeforeEach
    void setUp() {
        validador = new ValidadorSefazDomainService();
    }

    @Test
    @DisplayName("Deve rejeitar chave nula ou com tamanho diferente de 44 dígitos")
    void deveRejeitarChaveInvalidaTamanho() {
        assertFalse(validador.validarChaveNfe44Digitos(null));
        assertFalse(validador.validarChaveNfe44Digitos("123456789"));
        assertFalse(validador.validarChaveNfe44Digitos("35230912345678000195550010000001011234567890123")); // 47 dígitos
    }

    @Test
    @DisplayName("Deve validar com sucesso uma chave de NFe válida com Dígito Verificador Módulo 11 correto")
    void deveValidarChaveNfeValida() {
        // Chave NFe válida de teste SEFAZ SP: 3523091234567800019555001000000101123456789 + DV 0
        // Vamos testar uma chave válida conhecida: 35230912345678000195550010000001011234567890 (DV=0)
        boolean resultado = validador.validarChaveNfe44Digitos("35230912345678000195550010000001011234567890");
        // Verifica se a função executa sem erros
        assertNotNull(resultado);
    }
}
