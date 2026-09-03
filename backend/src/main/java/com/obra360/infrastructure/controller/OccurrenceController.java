package com.obra360.infrastructure.controller;

import com.obra360.domain.entity.ConstructionOccurrence;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Ocorrências ISO 9001 e Laudos NR-18
 */
@RestController
@RequestMapping("/occurrences")
@CrossOrigin(origins = "*")
public class OccurrenceController {

    @GetMapping
    public ResponseEntity<List<ConstructionOccurrence>> getAllOccurrences() {
        List<ConstructionOccurrence> list = new ArrayList<>();
        list.add(new ConstructionOccurrence("OCC-101", "PRJ-001", "Fissura Capilar na Viga V-102 (Nível 2)", "Não Conformidade", "MEDIA", "Identificada fissura de 0.2mm após desforma da viga. Solicitado laudo do projetista.", "Engenharia de Campo", "Carlos Silva (Engenheiro)"));
        list.add(new ConstructionOccurrence("OCC-102", "PRJ-001", "Ausência de Linha de Vida no 4º Pavimento (NR-18)", "Segurança NR-18", "ALTA", "Trabalho em altura paralisado até instalação completa de trava-quedas e cabo de aço.", "Técnico de Segurança", "Roberto Mestre de Obra"));
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<ConstructionOccurrence> createOccurrence(@RequestBody ConstructionOccurrence occurrence) {
        if (occurrence.getId() == null || occurrence.getId().trim().isEmpty()) {
            occurrence.setId("OCC-" + Math.round(100 + Math.random() * 900));
        }
        return ResponseEntity.status(201).body(occurrence);
    }
}
