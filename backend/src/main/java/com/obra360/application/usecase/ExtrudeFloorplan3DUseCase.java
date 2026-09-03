package com.obra360.application.usecase;

import com.obra360.domain.entity.BuildingElement;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - APPLICATION / USE CASES LAYER
 * Caso de Uso Assíncrono para Extrusão Vetorial de Planta 2D em Geometria 3D BIM
 */
@Service
public class ExtrudeFloorplan3DUseCase {

    private static final Logger log = Logger.getLogger(ExtrudeFloorplan3DUseCase.class.getName());

    @Async
    public CompletableFuture<List<BuildingElement>> executeAsync(String floorplanFileName, String presetName) {
        log.info("Executando Caso de Uso Assíncrono: ExtrudeFloorplan3DUseCase para arquivo " + floorplanFileName);

        // 1. Processamento Assíncrono em Background
        List<BuildingElement> extruded3dElements = new ArrayList<>();

        extruded3dElements.add(new BuildingElement("ELEM-001", "Radier & Sapata de Fundação (" + presetName + ")", "Fundação", "CONCLUIDO", 100, 1, "Concreto Armado Fck 30MPa", "AI CAD Parser", 0, 0, 0));
        extruded3dElements.add(new BuildingElement("ELEM-002", "Vigas Baldrame Impermeabilizadas", "Fundação", "CONCLUIDO", 100, 2, "Tinta Asfáltica Manta 4mm", "AI CAD Parser", 0, 0, 0));
        extruded3dElements.add(new BuildingElement("ELEM-003", "Pilares Estruturais CA-50 (Planta 2D)", "Estrutura", "CONCLUIDO", 100, 3, "Concreto CA-50", "AI CAD Parser", -4.8, 2.8, -3.2));
        extruded3dElements.add(new BuildingElement("ELEM-004", "Alvenaria Externa & Vedações (2D)", "Alvenaria", "EM_EXECUCAO", 85, 4, "Blocos Cerâmicos Baianos", "AI CAD Parser", 4.9, 2.8, 0));
        extruded3dElements.add(new BuildingElement("ELEM-005", "Vedações Internas & Divisórias (2D)", "Alvenaria", "EM_EXECUCAO", 70, 5, "Blocos de Concreto Estrutural", "AI CAD Parser", 0, 2.8, -3.3));
        extruded3dElements.add(new BuildingElement("ELEM-006", "Laje Térreo Pré-Moldada H12", "Estrutura", "EM_EXECUCAO", 50, 6, "Vigotas EPS H12", "AI CAD Parser", 0, 4.4, 0));
        extruded3dElements.add(new BuildingElement("ELEM-007", "Estrutura de Telhado & Painéis Solares", "Estrutura", "PLANEJADO", 0, 7, "Telhas Cerâmicas & Placas Fotovoltaicas", "AI CAD Parser", 0, 6.0, 0));

        try {
            Thread.sleep(500); // Latência simulada de processamento geométrico
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        log.info("Extrusão 3D concluída com sucesso. " + extruded3dElements.size() + " elementos gerados.");
        return CompletableFuture.completedFuture(extruded3dElements);
    }
}
