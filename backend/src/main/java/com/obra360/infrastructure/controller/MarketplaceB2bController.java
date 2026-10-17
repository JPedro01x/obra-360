package com.obra360.infrastructure.controller;

import com.obra360.domain.entity.B2bMaterialRFQ;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Cotações B2B & Marketplace de Suprimentos
 */
@RestController
@RequestMapping("/marketplace")
@CrossOrigin(origins = "*")
public class MarketplaceB2bController {

    @GetMapping("/rfq")
    public ResponseEntity<List<B2bMaterialRFQ>> getAllRfqs() {
        List<B2bMaterialRFQ> list = new ArrayList<>();
        list.add(new B2bMaterialRFQ("RFQ-201", "Cimento CP II Fck 30MPa - Lote 500 Sacos", "Carlos Engenheiro", "Insumos Estruturais", 500, "Sacos", "Votoran Cimentos", 16250.00));
        list.add(new B2bMaterialRFQ("RFQ-202", "Vergalhão Aço Gerdau CA-50 12mm - 200 Barras", "Amanda Gerente", "Aço & Armações", 200, "Barras", "Gerdau Aços", 11800.00));
        return ResponseEntity.ok(list);
    }

    @PostMapping("/rfq")
    public ResponseEntity<B2bMaterialRFQ> createRfq(@RequestBody B2bMaterialRFQ rfq) {
        if (rfq.getId() == null || rfq.getId().trim().isEmpty()) {
            rfq.setId("RFQ-" + Math.round(100 + Math.random() * 900));
        }
        return ResponseEntity.status(201).body(rfq);
    }
}
