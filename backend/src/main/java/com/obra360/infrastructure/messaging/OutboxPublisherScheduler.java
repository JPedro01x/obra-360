package com.obra360.infrastructure.messaging;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.logging.Logger;

/**
 * MICROSERVICES PATTERN: TRANSACTIONAL OUTBOX PUBLISHER SCHEDULER
 * Poller assíncrono em segundo plano que transmite eventos retidos no Outbox para o Apache Kafka
 */
@Component
@EnableScheduling
public class OutboxPublisherScheduler {

    private static final Logger log = Logger.getLogger(OutboxPublisherScheduler.class.getName());

    private final SpringDataOutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    public OutboxPublisherScheduler(SpringDataOutboxRepository outboxRepository, KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 5000)
    public void processPendingOutboxEvents() {
        List<OutboxEventJpaEntity> pendingEvents = outboxRepository.findByProcessedFalse();
        if (pendingEvents.isEmpty()) return;

        log.info("📦 OUTBOX PATTERN: Processando " + pendingEvents.size() + " evento(s) pendente(s) de envio assíncrono para o Kafka...");

        for (OutboxEventJpaEntity event : pendingEvents) {
            try {
                kafkaTemplate.send("obra360.events.stock-min", event.getAggregateId(), event.getPayload());
                event.setProcessed(true);
                outboxRepository.save(event);
                log.info("✅ Evento Outbox ID [" + event.getId() + "] entregue com sucesso ao Apache Kafka!");
            } catch (Exception e) {
                log.warning("Servidor Kafka indisponível. Evento Outbox mantido no banco para re-tentativa.");
            }
        }
    }
}
