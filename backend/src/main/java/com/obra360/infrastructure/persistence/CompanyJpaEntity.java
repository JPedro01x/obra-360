package com.obra360.infrastructure.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
 * Tabela do Banco de Dados Relacional (JPA Entity / Hibernate) para Organizações Multi-Tenant
 */
@Entity
@Table(name = "tb_companies")
public class CompanyJpaEntity {

    @Id
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

    public CompanyJpaEntity() {}

    public CompanyJpaEntity(String id, String name, String cnpj, String segment, String plan, boolean verifiedBadge, int activeProjectsCount, int membersCount, String cityState, String phone) {
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
