package com.obra360.infrastructure.controller;

import com.obra360.application.usecase.OccurrenceService;
import com.obra360.domain.entity.ConstructionOccurrence;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Ocorrências ISO 9001 e Laudos NR-18
 */
@RestController
@RequestMapping("/api/v1/occurrences")
@CrossOrigin(origins = "*")
public class OccurrenceController {

    private final OccurrenceService occurrenceService;

    public OccurrenceController(OccurrenceService occurrenceService) {
        this.occurrenceService = occurrenceService;
    }

    @GetMapping
    public ResponseEntity<List<ConstructionOccurrence>> getAllOccurrences() {
        List<ConstructionOccurrence> list = occurrenceService.findAllOccurrences();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ConstructionOccurrence>> getOccurrencesByProjectId(@PathVariable("projectId") String projectId) {
        List<ConstructionOccurrence> list = occurrenceService.findByProjectId(projectId);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<ConstructionOccurrence> createOccurrence(@RequestBody ConstructionOccurrence occurrence) {
        ConstructionOccurrence created = occurrenceService.createOccurrence(occurrence);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ConstructionOccurrence> resolveOccurrence(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, String> payload) {
        String resolutionNotes = payload != null ? payload.get("resolutionNotes") : null;
        ConstructionOccurrence resolved = occurrenceService.resolveOccurrence(id, resolutionNotes);
        return ResponseEntity.ok(resolved);
    }
}
