package com.obra360.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataOccurrenceRepository extends JpaRepository<OccurrenceJpaEntity, String> {
    List<OccurrenceJpaEntity> findByProjectId(String projectId);
}
