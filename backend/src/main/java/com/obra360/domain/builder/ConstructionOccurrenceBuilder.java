package com.obra360.domain.builder;

import com.obra360.domain.entity.ConstructionOccurrence;

import java.time.LocalDateTime;

/**
 * GOF DESIGN PATTERN: BUILDER PATTERN
 * Construtor fluente para instanciação consistente e segura de ocorrências de canteiro.
 */
public class ConstructionOccurrenceBuilder {

    private String id;
    private String projectId;
    private String title;
    private String category;
    private String severity;
    private String description;
    private String assignedTo;
    private String status = "EM_CORRECAO";
    private String reportedBy;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean hasPhoto = true;

    public ConstructionOccurrenceBuilder id(String id) {
        this.id = id;
        return this;
    }

    public ConstructionOccurrenceBuilder projectId(String projectId) {
        this.projectId = projectId;
        return this;
    }

    public ConstructionOccurrenceBuilder title(String title) {
        this.title = title;
        return this;
    }

    public ConstructionOccurrenceBuilder category(String category) {
        this.category = category;
        return this;
    }

    public ConstructionOccurrenceBuilder severity(String severity) {
        this.severity = severity;
        return this;
    }

    public ConstructionOccurrenceBuilder description(String description) {
        this.description = description;
        return this;
    }

    public ConstructionOccurrenceBuilder assignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
        return this;
    }

    public ConstructionOccurrenceBuilder status(String status) {
        this.status = status;
        return this;
    }

    public ConstructionOccurrenceBuilder reportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
        return this;
    }

    public ConstructionOccurrenceBuilder createdAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public ConstructionOccurrenceBuilder hasPhoto(boolean hasPhoto) {
        this.hasPhoto = hasPhoto;
        return this;
    }

    public ConstructionOccurrence build() {
        ConstructionOccurrence occurrence = new ConstructionOccurrence();
        occurrence.setId(id);
        occurrence.setProjectId(projectId);
        occurrence.setTitle(title);
        occurrence.setCategory(category);
        occurrence.setSeverity(severity);
        occurrence.setDescription(description);
        occurrence.setAssignedTo(assignedTo);
        occurrence.setStatus(status);
        occurrence.setReportedBy(reportedBy);
        occurrence.setCreatedAt(createdAt);
        occurrence.setHasPhoto(hasPhoto);
        return occurrence;
    }
}
