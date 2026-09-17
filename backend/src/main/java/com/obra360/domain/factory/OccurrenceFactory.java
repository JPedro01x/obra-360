package com.obra360.domain.factory;

import com.obra360.domain.builder.ConstructionOccurrenceBuilder;
import com.obra360.domain.entity.ConstructionOccurrence;

import java.util.UUID;

/**
 * GOF DESIGN PATTERN: FACTORY PATTERN
 * Fábrica de domínio que garante invariantes de negócio na criação de ocorrências de canteiro.
 */
public class OccurrenceFactory {

    public static ConstructionOccurrence createSafetyOccurrence(String projectId, String title, String description, String reportedBy) {
        String id = "OCC-NR18-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return new ConstructionOccurrenceBuilder()
                .id(id)
                .projectId(projectId)
                .title(title)
                .category("Segurança NR-18")
                .severity("ALTA") // Invariante de domínio: Ocorrências de Segurança NR-18 são sempre severidade ALTA
                .description(description)
                .assignedTo("Técnico de Segurança do Trabalho")
                .reportedBy(reportedBy)
                .hasPhoto(true)
                .build();
    }

    public static ConstructionOccurrence createIso9001QualityOccurrence(String projectId, String title, String severity, String description, String reportedBy) {
        String id = "OCC-ISO-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return new ConstructionOccurrenceBuilder()
                .id(id)
                .projectId(projectId)
                .title(title)
                .category("Não Conformidade ISO 9001")
                .severity(severity != null ? severity : "MEDIA")
                .description(description)
                .assignedTo("Engenheiro de Qualidade")
                .reportedBy(reportedBy)
                .hasPhoto(true)
                .build();
    }
}
