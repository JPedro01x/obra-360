package com.obra360.infrastructure.controller;

import com.obra360.application.usecase.RegisterStockMovementUseCase;
import com.obra360.domain.entity.StockItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Controle de Almoxarifado & Conciliação NFe
 */
@RestController
@RequestMapping("/stock")
@CrossOrigin(origins = "*")
public class StockController {

    private final RegisterStockMovementUseCase registerStockMovementUseCase;

    @Autowired
    public StockController(RegisterStockMovementUseCase registerStockMovementUseCase) {
        this.registerStockMovementUseCase = registerStockMovementUseCase;
    }

    @GetMapping("/items")
    public ResponseEntity<List<StockItem>> getAllStockItems() {
        List<StockItem> items = new ArrayList<>();
        items.add(new StockItem("STK-001", "CIM-30MPA", "Cimento Votoran / Cauê Fck 30MPa (Saco 50kg)", "Insumos Estruturais", 320, "Sacos", 100, "Votoran Cimentos S/A"));
        items.add(new StockItem("STK-002", "ACO-CA50-10", "Aço Gerdau CA-50 Vergalhão 10mm (Barra 12m)", "Aço & Armações", 180, "Barras", 50, "Gerdau Aços Longos"));
        items.add(new StockItem("STK-003", "TIJ-BAIANO-14", "Tijolo Baiano Cerâmico 14x19x29cm (Milheiro)", "Alvenaria", 14, "Milheiros", 5, "Cerâmica Santo Antônio"));
        return ResponseEntity.ok(items);
    }

    @PostMapping("/movement")
    public CompletableFuture<ResponseEntity<StockItem>> registerMovement(
            @RequestBody StockItem item,
            @RequestParam String type,
            @RequestParam int quantity,
            @RequestParam(required = false) String nfeKey) {

        return registerStockMovementUseCase.executeAsync(item, type, quantity, nfeKey)
                .thenApply(updated -> ResponseEntity.ok(updated));
    }
}
