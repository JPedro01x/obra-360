package com.obra360.infrastructure.controller;

import com.obra360.application.usecase.B2bMarketplaceService;
import com.obra360.domain.entity.B2bMaterialRFQ;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Cotações B2B & Marketplace de Suprimentos
 */
@RestController
@RequestMapping("/api/v1/marketplace")
@CrossOrigin(origins = "*")
public class MarketplaceB2bController {

    private final B2bMarketplaceService marketplaceService;

    public MarketplaceB2bController(B2bMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/rfq")
    public ResponseEntity<List<B2bMaterialRFQ>> getAllRfqs() {
        List<B2bMaterialRFQ> list = marketplaceService.findAllRfqs();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/rfq")
    public ResponseEntity<B2bMaterialRFQ> createRfq(@RequestBody B2bMaterialRFQ rfq) {
        B2bMaterialRFQ created = marketplaceService.createRfq(rfq);
        return ResponseEntity.status(201).body(created);
    }

    @PostMapping("/rfq/{id}/quote")
    public ResponseEntity<B2bMaterialRFQ> submitSupplierQuote(
            @PathVariable("id") String rfqId,
            @RequestBody SupplierQuoteRequest request) {
        B2bMaterialRFQ updated = marketplaceService.submitSupplierQuote(rfqId, request.supplierName(), request.price());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/verify-nfe")
    public ResponseEntity<Map<String, Object>> verifyNfeKey(@RequestBody Map<String, String> payload) {
        String nfeKey = payload.get("nfeKey");
        boolean isValid = marketplaceService.verifyNfeKey(nfeKey);
        Map<String, Object> response = Map.of(
                "nfeKey", nfeKey != null ? nfeKey : "",
                "valid", isValid,
                "message", isValid ? "Chave de 44 dígitos da NF-e validada com sucesso via SEFAZ Módulo 11." : "Chave de NF-e inválida. Uma chave válida deve conter exatamente 44 dígitos numéricos."
        );
        return ResponseEntity.ok(response);
    }

    public record SupplierQuoteRequest(String supplierName, double price) {}
}
