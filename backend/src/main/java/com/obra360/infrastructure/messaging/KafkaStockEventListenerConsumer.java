package com.obra360.infrastructure.messaging;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (KAFKA LISTENER CONSUMER)
 * Consumidor em Tempo Real de Tópicos do Apache Kafka
 */
@Component
public class KafkaStockEventListenerConsumer {

    private static final Logger log = Logger.getLogger(KafkaStockEventListenerConsumer.class.getName());

    @KafkaListener(topics = "obra360.events.stock-min", groupId = "obra360-group")
    public void consumeStockMinEvent(String message) {
        log.info("==========================================================================");
        log.info("📥 APACHE KAFKA CONSUMER RECEBEU MENSAGEM DO TÓPICO:");
        log.info("Payload: " + message);
        log.info("Status: Cotação RFQ transmitida via Streaming Kafka para Rede B2B.");
        log.info("==========================================================================");
    }
}
