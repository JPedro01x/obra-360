package com.obra360.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * CLEAN ARCHITECTURE - APPLICATION LAYER (DTO PATTERN)
 * Data Transfer Object imutável para transferência segura de dados nas requisições REST
 */
public record CompanyDTO(
        String id,

        @NotBlank(message = "O nome da empresa é obrigatório.")
        String name,

        @NotBlank(message = "O CNPJ é obrigatório.")
        @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}", message = "CNPJ em formato inválido. Use 00.000.000/0000-00.")
        String cnpj,

        @NotBlank(message = "O segmento da empresa é obrigatório.")
        String segment,

        String plan,
        boolean verifiedBadge,
        int activeProjectsCount,
        int membersCount,
        String cityState,
        String phone
) {}
