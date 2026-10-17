package com.obra360.domain.entity;

import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Entidade de Domínio DDD: Ocorrência / Não Conformidade ISO 9001 e Segurança NR-18
 */
public class ConstructionOccurrence {

    private String id;
    private String projectId;
    private String title;
    private String category; // Não Conformidade, Atraso, Manutenção, Falha de Execução, Segurança NR-18
    private String severity; // ALTA, MEDIA, BAIXA
    private String description;
    private String assignedTo;
    private String status; // EM_CORRECAO, RESOLVIDO, PENDENTE
    private String reportedBy;
    private LocalDateTime createdAt;
    private boolean hasPhoto;

    public ConstructionOccurrence() {
        this.createdAt = LocalDateTime.now();
    }

    public ConstructionOccurrence(String id, String projectId, String title, String category, String severity, String description, String assignedTo, String reportedBy) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.category = category;
        this.severity = severity;
        this.description = description;
        this.assignedTo = assignedTo;
        this.status = "EM_CORRECAO";
        this.reportedBy = reportedBy;
        this.createdAt = LocalDateTime.now();
        this.hasPhoto = true;
    }

    // Business Rules
    public void resolveOccurrence(String resolutionNotes) {
        this.status = "RESOLVIDO";
    }

    public boolean isHighCriticality() {
        return "ALTA".equalsIgnoreCase(this.severity) || "Segurança NR-18".equalsIgnoreCase(this.category);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isHasPhoto() { return hasPhoto; }
    public void setHasPhoto(boolean hasPhoto) { this.hasPhoto = hasPhoto; }
}
