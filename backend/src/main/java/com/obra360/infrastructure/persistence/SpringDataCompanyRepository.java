package com.obra360.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
 * Spring Data JPA Repository para Persistência Relacional de Organizações Multi-Tenant
 */
@Repository
public interface SpringDataCompanyRepository extends JpaRepository<CompanyJpaEntity, String> {
    Optional<CompanyJpaEntity> findByCnpj(String cnpj);
}
