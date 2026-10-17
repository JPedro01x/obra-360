package com.obra360.domain.strategy;

import com.obra360.domain.valueobject.NfeKey;

/**
 * GOF DESIGN PATTERN: STRATEGY INTERFACE
 * Interface para estratégias intercambiáveis de validação fiscal de Nota Fiscal Eletrônica (NFe)
 */
public interface NfeValidationStrategy {
    boolean validate(NfeKey nfeKey);
    String getStrategyName();
}
