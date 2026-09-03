package com.obra360.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (SPRING DATA REPOSITORY)
 */
@Repository
public interface SpringDataOccurrenceRepository extends JpaRepository<OccurrenceJpaEntity, String> {
}
