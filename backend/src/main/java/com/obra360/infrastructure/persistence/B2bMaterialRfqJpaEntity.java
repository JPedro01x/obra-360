package com.obra360.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_b2b_rfq")
public class B2bMaterialRfqJpaEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String requester;

    @Column(nullable = false)
    private String category;

    @Column(name = "quantity_needed", nullable = false)
    private int quantityNeeded;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private String status;

    @Column(name = "best_quote_supplier")
    private String bestQuoteSupplier;

    @Column(name = "best_quote_price")
    private Double bestQuotePrice;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public B2bMaterialRfqJpaEntity() {
        this.createdAt = LocalDateTime.now();
        this.deadline = LocalDateTime.now().plusDays(5);
        this.status = "ABERTA";
    }

    public B2bMaterialRfqJpaEntity(String id, String title, String requester, String category, int quantityNeeded, String unit, String status, String bestQuoteSupplier, Double bestQuotePrice, LocalDateTime deadline) {
        this.id = id;
        this.title = title;
        this.requester = requester;
        this.category = category;
        this.quantityNeeded = quantityNeeded;
        this.unit = unit;
        this.status = status != null ? status : "ABERTA";
        this.bestQuoteSupplier = bestQuoteSupplier;
        this.bestQuotePrice = bestQuotePrice;
        this.deadline = deadline != null ? deadline : LocalDateTime.now().plusDays(5);
        this.createdAt = LocalDateTime.now();
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

    public Double getBestQuotePrice() { return bestQuotePrice; }
    public void setBestQuotePrice(Double bestQuotePrice) { this.bestQuotePrice = bestQuotePrice; }

    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
