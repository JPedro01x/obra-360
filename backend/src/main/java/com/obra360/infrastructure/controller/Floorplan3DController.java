package com.obra360.infrastructure.controller;

import com.obra360.application.usecase.ExtrudeFloorplan3DUseCase;
import com.obra360.domain.entity.BuildingElement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE / ADAPTERS LAYER
 * REST Controller Spring Boot para Conversão Assíncrona 2D -> 3D BIM
 */
@RestController
@RequestMapping("/floorplans")
@CrossOrigin(origins = "*")
public class Floorplan3DController {

    private final ExtrudeFloorplan3DUseCase extrudeFloorplan3DUseCase;

    @Autowired
    public Floorplan3DController(ExtrudeFloorplan3DUseCase extrudeFloorplan3DUseCase) {
        this.extrudeFloorplan3DUseCase = extrudeFloorplan3DUseCase;
    }

    @PostMapping("/extrude")
    public CompletableFuture<ResponseEntity<List<BuildingElement>>> extrudeFloorplan(
            @RequestParam(defaultValue = "planta-2d-casa.dwg") String fileName,
            @RequestParam(defaultValue = "Casa 3 Quartos (120m²)") String presetName) {
        
        return extrudeFloorplan3DUseCase.executeAsync(fileName, presetName)
                .thenApply(elements -> ResponseEntity.ok(elements));
    }
}
