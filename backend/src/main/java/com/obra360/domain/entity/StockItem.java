package com.obra360.domain.entity;

import com.obra360.domain.valueobject.NfeKey;
import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Entidade de Domínio DDD: Item de Estoque / Almoxarifado
 */
public class StockItem {

    private String id;
    private String sku;
    private String name;
    private String category;
    private int quantity;
    private String unit;
    private int minStock;
    private String lastSupplier;

    public StockItem() {}

    public StockItem(String id, String sku, String name, String category, int quantity, String unit, int minStock, String lastSupplier) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minStock = minStock;
        this.lastSupplier = lastSupplier;
    }

    // Business Rules (DDD Methods)
    public boolean isLowStock() {
        return this.quantity <= this.minStock;
    }

    public void addStock(int delta, NfeKey nfeKey) {
        if (delta <= 0) {
            throw new IllegalArgumentException("A quantidade de entrada deve ser maior que zero.");
        }
        if (nfeKey != null) {
            nfeKey.getFormattedKey(); // Valida chave NFe
        }
        this.quantity += delta;
    }

    public void removeStock(int delta) {
        if (delta <= 0) {
            throw new IllegalArgumentException("A quantidade de saída deve ser maior que zero.");
        }
        if (this.quantity - delta < 0) {
            throw new IllegalStateException("Saldo insuficiente em estoque no almoxarifado para a quantidade solicitada.");
        }
        this.quantity -= delta;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public int getMinStock() { return minStock; }
    public void setMinStock(int minStock) { this.minStock = minStock; }

    public String getLastSupplier() { return lastSupplier; }
    public void setLastSupplier(String lastSupplier) { this.lastSupplier = lastSupplier; }
}
