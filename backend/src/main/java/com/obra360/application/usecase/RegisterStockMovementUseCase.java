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
 * 
 * <p>Orquestra o fluxo de entrada e saída de insumos do almoxarifado de canteiro,
 * executando a validação fiscal da chave NFe de 44 dígitos e disparando eventos de domínio
 * assíncronos no Apache Kafka / RabbitMQ quando o item atinge o nível crítico de estoque mínimo.</p>
 */
@Service
public class RegisterStockMovementUseCase {

    private static final Logger log = Logger.getLogger(RegisterStockMovementUseCase.class.getName());
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Construtor com injeção de dependências do Spring.
     * 
     * @param eventPublisher Publicador de eventos de aplicação
     */
    public RegisterStockMovementUseCase(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    /**
     * Executa a movimentação de estoque de forma totalmente assíncrona.
     * 
     * @param stockItem Item de estoque a ser movimentado
     * @param movementType Tipo da operação: "ENTRADA" ou "SAIDA"
     * @param quantity Quantidade física a ser debitada ou creditada
     * @param nfeRawKey Chave de acesso de Nota Fiscal Eletrônica (44 dígitos numéricos)
     * @return CompletableFuture contendo o estado atualizado do item de estoque
     * @throws IllegalArgumentException Se o tipo da movimentação for inválido ou a chave NFe não contiver 44 dígitos
     */
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
