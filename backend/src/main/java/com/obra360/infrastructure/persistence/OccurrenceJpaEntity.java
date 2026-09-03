package com.obra360.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (JPA ENTITY)
 * Mapeamento JPA da tabela tb_occurrences (ISO 9001 / NR-18)
 */
@Entity
@Table(name = "tb_occurrences")
public class OccurrenceJpaEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String projectId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String assignedTo;

    @Column(nullable = false)
    private String status = "EM_CORRECAO";

    private String reportedBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean hasPhoto = true;

    public OccurrenceJpaEntity() {}

    public OccurrenceJpaEntity(String id, String projectId, String title, String category, String severity, String description, String assignedTo, String status, String reportedBy, boolean hasPhoto) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.category = category;
        this.severity = severity;
        this.description = description;
        this.assignedTo = assignedTo;
        this.status = status;
        this.reportedBy = reportedBy;
        this.hasPhoto = hasPhoto;
    }

    public String getId() { return id; }
    public String getProjectId() { return projectId; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getSeverity() { return severity; }
    public String getDescription() { return description; }
    public String getAssignedTo() { return assignedTo; }
    public String getStatus() { return status; }
    public String getReportedBy() { return reportedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isHasPhoto() { return hasPhoto; }
}
