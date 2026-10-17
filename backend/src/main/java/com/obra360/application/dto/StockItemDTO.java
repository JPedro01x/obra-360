package com.obra360.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * CLEAN ARCHITECTURE - APPLICATION LAYER (DTO PATTERN)
 */
public record StockItemDTO(
        String id,

        @NotBlank(message = "O código SKU é obrigatório.")
        String sku,

        @NotBlank(message = "O nome do insumo é obrigatório.")
        String name,

        @NotBlank(message = "A categoria é obrigatória.")
        String category,

        @Min(value = 0, message = "A quantidade não pode ser negativa.")
        int quantity,

        @NotBlank(message = "A unidade de medida é obrigatória.")
        String unit,

        @Min(value = 1, message = "O estoque mínimo deve ser no mínimo 1.")
        int minStock,

        String lastSupplier
) {}
