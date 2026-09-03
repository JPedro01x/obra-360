package com.obra360.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (JPA ENTITY)
 * Mapeamento JPA da tabela tb_users com Controle de Acesso Baseado em Perfis (RBAC - 13 Roles)
 */
@Entity
@Table(name = "tb_users")
public class UserJpaEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role; // RBAC Role (ex: ADMIN_GERAL, ENGENHEIRO_CHEFE, ALMOXARIFE, etc.)

    @Column(nullable = false)
    private String companyId; // Multi-Tenant Company Isolation

    @Column(nullable = false)
    private boolean active = true;

    private String avatarUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    public UserJpaEntity() {}

    public UserJpaEntity(String id, String name, String email, String role, String companyId, boolean active, String avatarUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.companyId = companyId;
        this.active = active;
        this.avatarUrl = avatarUrl;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getCompanyId() { return companyId; }
    public boolean isActive() { return active; }
    public String getAvatarUrl() { return avatarUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
