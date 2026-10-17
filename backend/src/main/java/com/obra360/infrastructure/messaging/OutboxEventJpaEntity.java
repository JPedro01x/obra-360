package com.obra360.infrastructure.messaging;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * MICROSERVICES PATTERN: TRANSACTIONAL OUTBOX PATTERN (ENTITY)
 * Garante consistência eventual e entrega de eventos ("At-Least-Once Delivery") em Microserviços
 */
@Entity
@Table(name = "tb_outbox_events")
public class OutboxEventJpaEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String aggregateType;

    @Column(nullable = false)
    private String aggregateId;

    @Column(nullable = false)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Column(nullable = false)
    private boolean processed = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public OutboxEventJpaEntity() {}

    public OutboxEventJpaEntity(String id, String aggregateType, String aggregateId, String eventType, String payload) {
        this.id = id;
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = payload;
    }

    public String getId() { return id; }
    public String getAggregateType() { return aggregateType; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
