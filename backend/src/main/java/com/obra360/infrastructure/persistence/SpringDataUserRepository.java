package com.obra360.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (SPRING DATA REPOSITORY)
 */
@Repository
public interface SpringDataUserRepository extends JpaRepository<UserJpaEntity, String> {
    List<UserJpaEntity> findByCompanyId(String companyId);
    List<UserJpaEntity> findByRole(String role);
    java.util.Optional<UserJpaEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}
