package com.obra360.domain.entity;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Domain Entity: Elemento 3D BIM Espacial da Obra
 */
public class BuildingElement {

    private String id;
    private String name;
    private String category; // Fundação, Estrutura, Alvenaria, Instalações, Acabamento
    private String status; // CONCLUIDO, EM_EXECUCAO, PLANEJADO, ATRASADO
    private int progressPercent;
    private int assignedWeek;
    private String materialUsed;
    private String lastUpdatedBy;
    private String lastUpdatedAt;
    private double posX;
    private double posY;
    private double posZ;

    public BuildingElement() {}

    public BuildingElement(String id, String name, String category, String status, int progressPercent, int assignedWeek, String materialUsed, String lastUpdatedBy, double posX, double posY, double posZ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.status = status;
        this.progressPercent = progressPercent;
        this.assignedWeek = assignedWeek;
        this.materialUsed = materialUsed;
        this.lastUpdatedBy = lastUpdatedBy;
        this.posX = posX;
        this.posY = posY;
        this.posZ = posZ;
        this.lastUpdatedAt = "Agora";
    }

    // Business Rules
    public void updateProgress(int newProgressPercent) {
        if (newProgressPercent < 0 || newProgressPercent > 100) {
            throw new IllegalArgumentException("O percentual de avanço físico deve estar entre 0% e 100%.");
        }
        this.progressPercent = newProgressPercent;
        if (newProgressPercent == 100) {
            this.status = "CONCLUIDO";
        } else if (newProgressPercent > 0) {
            this.status = "EM_EXECUCAO";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getProgressPercent() { return progressPercent; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }

    public int getAssignedWeek() { return assignedWeek; }
    public void setAssignedWeek(int assignedWeek) { this.assignedWeek = assignedWeek; }

    public String getMaterialUsed() { return materialUsed; }
    public void setMaterialUsed(String materialUsed) { this.materialUsed = materialUsed; }

    public String getLastUpdatedBy() { return lastUpdatedBy; }
    public void setLastUpdatedBy(String lastUpdatedBy) { this.lastUpdatedBy = lastUpdatedBy; }

    public String getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(String lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

    public double getPosX() { return posX; }
    public void setPosX(double posX) { this.posX = posX; }

    public double getPosY() { return posY; }
    public void setPosY(double posY) { this.posY = posY; }

    public double getPosZ() { return posZ; }
    public void setPosZ(double posZ) { this.posZ = posZ; }
}
