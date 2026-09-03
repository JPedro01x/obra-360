package com.obra360.application.usecase;

import com.obra360.domain.entity.StockItem;
import com.obra360.domain.event.StockMinReachedEvent;
import com.obra360.domain.valueobject.NfeKey;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - APPLICATION / USE CASES LAYER
 * Caso de Uso Assíncrono para Movimentação de Almoxarifado com Validação NFe e Disparo de Evento PubSub
 */
@Service
public class RegisterStockMovementUseCase {

    private static final Logger log = Logger.getLogger(RegisterStockMovementUseCase.class.getName());
    private final ApplicationEventPublisher eventPublisher;

    public RegisterStockMovementUseCase(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Async
    public CompletableFuture<StockItem> executeAsync(StockItem stockItem, String movementType, int quantity, String nfeRawKey) {
        log.info("Executando Caso de Uso Assíncrono: RegisterStockMovementUseCase (" + movementType + " x" + quantity + " " + stockItem.getName() + ")");

        if ("ENTRADA".equalsIgnoreCase(movementType)) {
            NfeKey nfeKey = null;
            if (nfeRawKey != null && !nfeRawKey.trim().isEmpty()) {
                nfeKey = new NfeKey(nfeRawKey);
            }
            stockItem.addStock(quantity, nfeKey);
        } else if ("SAIDA".equalsIgnoreCase(movementType)) {
            stockItem.removeStock(quantity);
        } else {
            throw new IllegalArgumentException("Tipo de movimentação inválido. Utilize ENTRADA ou SAIDA.");
        }

        // Regra de Negócio: Se o estoque atingir o limite mínimo SKU, dispara um Evento de Domínio
        if (stockItem.isLowStock()) {
            log.warning("ALERTA DE ESTOQUE MÍNIMO: Disparando evento de domínio assíncrono para SKU " + stockItem.getSku());
            StockMinReachedEvent event = new StockMinReachedEvent(
                    UUID.randomUUID().toString(),
                    stockItem.getSku(),
                    stockItem.getName(),
                    stockItem.getQuantity(),
                    stockItem.getMinStock()
            );
            eventPublisher.publishEvent(event);
        }

        return CompletableFuture.completedFuture(stockItem);
    }
}
