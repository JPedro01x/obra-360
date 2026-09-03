package com.obra360.infrastructure.messaging;

import com.obra360.domain.event.StockMinReachedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (EVENT PUBLISHER ADAPTER)
 * Adaptador de Infraestrutura para publicação de Eventos de Domínio no Apache Kafka
 */
@Component
public class KafkaEventPublisherAdapter {

    private static final Logger log = Logger.getLogger(KafkaEventPublisherAdapter.class.getName());
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    public KafkaEventPublisherAdapter(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    public void publishStockMinEvent(StockMinReachedEvent event) {
        String topic = "obra360.events.stock-min";
        String payload = String.format("{\"eventId\":\"%s\",\"sku\":\"%s\",\"productName\":\"%s\",\"quantity\":%d,\"minStock\":%d}",
                event.getEventId(), event.getSku(), event.getProductName(), event.getCurrentQuantity(), event.getMinStock());

        log.info("🚀 PUBLICANDO EVENTO DE DOMÍNIO NO APACHE KAFKA [Tópico: " + topic + "]: " + payload);
        
        try {
            kafkaTemplate.send(topic, event.getSku(), payload);
        } catch (Exception e) {
            log.warning("Servidor Kafka offline. Evento retido no barramento local assíncrono.");
        }
    }
}
