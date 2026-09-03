package com.obra360.infrastructure.messaging;

import com.obra360.domain.event.StockMinReachedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
 * Event Listener PubSub que consome assincronamente os Eventos de Domínio do Almoxarifado
 */
@Component
public class StockEventListenerConsumer {

    private static final Logger log = Logger.getLogger(StockEventListenerConsumer.class.getName());

    @Async
    @EventListener
    public void handleStockMinReached(StockMinReachedEvent event) {
        log.info("==========================================================================");
        log.info("📢 EVENTO PUBSUB RECEBIDO: ESTOQUE MÍNIMO ATINGIDO");
        log.info("ID Evento: " + event.getEventId());
        log.info("Insumo SKU: " + event.getSku() + " - " + event.getProductName());
        log.info("Quantidade Atual: " + event.getCurrentQuantity() + " (Mínimo: " + event.getMinStock() + ")");
        log.info("Ação Automática: Cotação RFQ gerada e transmitida à Rede B2B.");
        log.info("==========================================================================");
    }
}
