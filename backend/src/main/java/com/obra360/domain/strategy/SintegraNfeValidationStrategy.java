package com.obra360.domain.strategy;

import com.obra360.domain.valueobject.NfeKey;
import org.springframework.stereotype.Component;

/**
 * GOF DESIGN PATTERN: CONCRETE STRATEGY 2
 * Estratégia de validação tributária baseada no protocolo SINTEGRA estadual.
 */
@Component("sintegraNfeValidationStrategy")
public class SintegraNfeValidationStrategy implements NfeValidationStrategy {

    @Override
    public boolean validate(NfeKey nfeKey) {
        if (nfeKey == null || nfeKey.getValue() == null) {
            return false;
        }
        String cleanKey = nfeKey.getValue().replaceAll("\\D", "");
        // Validação SINTEGRA: exige exatamente 44 dígitos e código UF válido (entre 11 e 53)
        if (cleanKey.length() != 44) {
            return false;
        }
        int ufCode = Integer.parseInt(cleanKey.substring(0, 2));
        return ufCode >= 11 && ufCode <= 53;
    }

    @Override
    public String getStrategyName() {
        return "SINTEGRA Regional Tax Validation Strategy";
    }
}
