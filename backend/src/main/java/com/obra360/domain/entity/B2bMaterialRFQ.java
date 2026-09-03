package com.obra360.domain.entity;

import java.time.LocalDateTime;

/**
 * CLEAN ARCHITECTURE - DOMAIN LAYER (ENTITIES)
 * Entidade de Domínio DDD: Cotação RFQ de Insumos B2B
 */
public class B2bMaterialRFQ {

    private String id;
    private String title;
    private String requester;
    private String category;
    private int quantityNeeded;
    private String unit;
    private String status; // ABERTA, EM_ANALISE, FECHADA
    private String bestQuoteSupplier;
    private double bestQuotePrice;
    private LocalDateTime deadline;

    public B2bMaterialRFQ() {
        this.deadline = LocalDateTime.now().plusDays(5);
    }

    public B2bMaterialRFQ(String id, String title, String requester, String category, int quantityNeeded, String unit, String bestQuoteSupplier, double bestQuotePrice) {
        this.id = id;
        this.title = title;
        this.requester = requester;
        this.category = category;
        this.quantityNeeded = quantityNeeded;
        this.unit = unit;
        this.status = "ABERTA";
        this.bestQuoteSupplier = bestQuoteSupplier;
        this.bestQuotePrice = bestQuotePrice;
        this.deadline = LocalDateTime.now().plusDays(5);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRequester() { return requester; }
    public void setRequester(String requester) { this.requester = requester; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getQuantityNeeded() { return quantityNeeded; }
    public void setQuantityNeeded(int quantityNeeded) { this.quantityNeeded = quantityNeeded; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getBestQuoteSupplier() { return bestQuoteSupplier; }
    public void setBestQuoteSupplier(String bestQuoteSupplier) { this.bestQuoteSupplier = bestQuoteSupplier; }

    public double getBestQuotePrice() { return bestQuotePrice; }
    public void setBestQuotePrice(double bestQuotePrice) { this.bestQuotePrice = bestQuotePrice; }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
}
