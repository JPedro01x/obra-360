package com.obra360.domain.event;

import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN EVENT (DDD)
 * Domain Event disparado assincronamente quando o estoque atinge o limite mínimo SKU.
 */
public class StockMinReachedEvent {

    private final String eventId;
    private final String sku;
    private final String productName;
    private final int currentQuantity;
    private final int minStock;
    private final LocalDateTime timestamp;

    public StockMinReachedEvent(String eventId, String sku, String productName, int currentQuantity, int minStock) {
        this.eventId = eventId;
        this.sku = sku;
        this.productName = productName;
        this.currentQuantity = currentQuantity;
        this.minStock = minStock;
        this.timestamp = LocalDateTime.now();
    }

    public String getEventId() { return eventId; }
    public String getSku() { return sku; }
    public String getProductName() { return productName; }
    public int getCurrentQuantity() { return currentQuantity; }
    public int getMinStock() { return minStock; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
