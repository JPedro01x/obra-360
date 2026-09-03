package com.obra360.domain.entity;

import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Domain-Driven Design (DDD) Aggregate Root: Company / Tenant
 */
public class Company {

    private String id;
    private String name;
    private String cnpj;
    private String segment;
    private String plan;
    private boolean verifiedBadge;
    private int activeProjectsCount;
    private int membersCount;
    private String cityState;
    private String phone;
    private LocalDateTime createdAt;

    public Company() {}

    public Company(String id, String name, String cnpj, String segment, String plan, boolean verifiedBadge, int activeProjectsCount, int membersCount, String cityState, String phone) {
        this.id = id;
        this.name = name;
        this.cnpj = cnpj;
        this.segment = segment;
        this.plan = plan;
        this.verifiedBadge = verifiedBadge;
        this.activeProjectsCount = activeProjectsCount;
        this.membersCount = membersCount;
        this.cityState = cityState;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
    }

    // Business Rules (DDD Domain Methods)
    public void validateCnpj() {
        if (this.cnpj == null || this.cnpj.trim().length() < 14) {
            throw new IllegalArgumentException("CNPJ inválido para cadastro de organização corporativa Multi-Tenant.");
        }
    }

    public void incrementActiveProjects() {
        this.activeProjectsCount++;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public boolean isVerifiedBadge() { return verifiedBadge; }
    public void setVerifiedBadge(boolean verifiedBadge) { this.verifiedBadge = verifiedBadge; }

    public int getActiveProjectsCount() { return activeProjectsCount; }
    public void setActiveProjectsCount(int activeProjectsCount) { this.activeProjectsCount = activeProjectsCount; }

    public int getMembersCount() { return membersCount; }
    public void setMembersCount(int membersCount) { this.membersCount = membersCount; }

    public String getCityState() { return cityState; }
    public void setCityState(String cityState) { this.cityState = cityState; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
