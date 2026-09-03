package com.obra360.infrastructure.persistence;

import jakarta.persistence.*;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER (JPA ENTITY)
 * Mapeamento JPA da tabela tb_stock_items
 */
@Entity
@Table(name = "tb_stock_items")
public class StockItemJpaEntity {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private int minStock;

    private String lastSupplier;

    public StockItemJpaEntity() {}

    public StockItemJpaEntity(String id, String sku, String name, String category, int quantity, String unit, int minStock, String lastSupplier) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minStock = minStock;
        this.lastSupplier = lastSupplier;
    }

    public String getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public int getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public int getMinStock() { return minStock; }
    public String getLastSupplier() { return lastSupplier; }
}
