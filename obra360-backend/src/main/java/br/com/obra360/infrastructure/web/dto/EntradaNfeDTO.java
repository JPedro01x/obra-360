package br.com.obra360.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record EntradaNfeDTO(
        @NotBlank(message = "A chave de 44 dígitos da NFe é obrigatória.")
        @Size(min = 44, max = 44, message = "A chave da NFe deve conter exatamente 44 dígitos numéricos.")
        String chaveNfe44Digitos,

        @NotBlank(message = "O SKU do item é obrigatório.")
        String sku,

        @NotNull(message = "A quantidade é obrigatória.")
        @Positive(message = "A quantidade deve ser maior que zero.")
        BigDecimal quantidade,

        @NotNull(message = "O valor total da movimentação é obrigatório.")
        @Positive(message = "O valor total deve ser positivo.")
        BigDecimal valorTotal
) {}
