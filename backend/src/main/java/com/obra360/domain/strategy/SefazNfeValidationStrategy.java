package com.obra360.domain.strategy;

import com.obra360.domain.valueobject.NfeKey;
import org.springframework.stereotype.Component;

/**
 * GOF DESIGN PATTERN: CONCRETE STRATEGY 1
 * Estratégia de validação estrita baseada nos algoritmos oficiais da SEFAZ (44 dígitos numéricos)
 */
@Component("sefazNfeValidationStrategy")
public class SefazNfeValidationStrategy implements NfeValidationStrategy {

    @Override
    public boolean validate(NfeKey nfeKey) {
        if (nfeKey == null || nfeKey.getValue() == null) {
            return false;
        }
        String cleanKey = nfeKey.getValue().replaceAll("\\D", "");
        // Validação estrita do padrão de 44 dígitos da SEFAZ
        return cleanKey.length() == 44;
    }

    @Override
    public String getStrategyName() {
        return "SEFAZ Official 44-Digit Access Key Verification Strategy";
    }
}
