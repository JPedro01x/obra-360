package com.obra360.domain.valueobject;

import java.util.Objects;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (VALUE OBJECT)
 * Domain-Driven Design (DDD) Value Object imutável para a Chave de Acesso NFe de 44 dígitos
 */
public final class NfeKey {

    private final String value;

    public NfeKey(String value) {
        if (value == null || !value.matches("\\d{44}")) {
            throw new IllegalArgumentException("Chave de acesso NFe inválida. A chave deve conter exatamente 44 dígitos numéricos.");
        }
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public String getFormattedKey() {
        // Formato padrão SEFAZ: 3526 0912 3456 7800 0190 5500 1000 0001 2314 5678 9012
        StringBuilder sb = new StringBuilder(value);
        for (int i = 40; i > 0; i -= 4) {
            sb.insert(i, " ");
        }
        return sb.toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NfeKey nfeKey = (NfeKey) o;
        return Objects.equals(value, nfeKey.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return getFormattedKey();
    }
}
