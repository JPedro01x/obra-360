package com.obra360.domain.entity;

import com.obra360.domain.valueobject.NfeKey;
import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Domain-Driven Design (DDD) Entity: Item de Estoque / Almoxarifado (StockItem)
 * 
 * <p>Esta entidade representa um produto ou insumo físico armazenado no almoxarifado de canteiro,
 * contendo as regras de negócio de saldo, limite crítico de estoque mínimo e integração fiscal NFe.</p>
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

    /** Construtor padrão sem argumentos para serialização e reflexão. */
    public StockItem() {}

    /**
     * Construtor completo para criação de item de almoxarifado.
     * 
     * @param id Identificador único (ex: STK-001)
     * @param sku Código de catálogo SKU (ex: CIM-30MPA)
     * @param name Nome comercial do insumo
     * @param category Categoria de insumo (Insumos Estruturais, Elétricos)
     * @param quantity Saldo físico atual em estoque
     * @param unit Unidade de medida (Sacos, Metros, Toneladas)
     * @param minStock Limite crítico de estoque mínimo para alerta
     * @param lastSupplier Fornecedor da última Nota Fiscal
     */
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

    /**
     * Verifica se o saldo atual do insumo atingiu ou ficou abaixo do limite crítico.
     * 
     * @return true se o estoque estiver no nível mínimo crítico, false caso contrário
     */
    public boolean isLowStock() {
        return this.quantity <= this.minStock;
    }

    /**
     * Adiciona saldo ao estoque a partir de uma Nota Fiscal Eletrônica (NFe).
     * 
     * @param delta Quantidade positiva a ser creditada
     * @param nfeKey Value Object da chave de acesso NFe de 44 dígitos
     * @throws IllegalArgumentException Se a quantidade for menor ou igual a zero
     */
    public void addStock(int delta, NfeKey nfeKey) {
        if (delta <= 0) {
            throw new IllegalArgumentException("A quantidade de entrada deve ser maior que zero.");
        }
        if (nfeKey != null) {
            nfeKey.getFormattedKey(); // Valida chave NFe
        }
        this.quantity += delta;
    }

    /**
     * Debita saldo do estoque para utilização no canteiro de obras.
     * 
     * @param delta Quantidade positiva a ser debitada
     * @throws IllegalArgumentException Se a quantidade for menor ou igual a zero
     * @throws IllegalStateException Se o saldo for insuficiente para cobrir a baixa
     */
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
