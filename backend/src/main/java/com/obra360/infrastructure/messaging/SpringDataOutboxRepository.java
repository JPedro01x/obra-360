package com.obra360.infrastructure.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MICROSERVICES PATTERN: TRANSACTIONAL OUTBOX REPOSITORY
 */
@Repository
public interface SpringDataOutboxRepository extends JpaRepository<OutboxEventJpaEntity, String> {
    List<OutboxEventJpaEntity> findByProcessedFalse();
}
