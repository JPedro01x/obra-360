package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.VendasImobiliariasService;
import br.com.obra360.domain.entity.GarantiaPosVendaEntity;
import br.com.obra360.domain.entity.UnidadeImobiliariaEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UnidadeImobiliariaController {

    private final VendasImobiliariasService vendasService;

    @PostMapping("/unidades-imobiliarias")
    public ResponseEntity<UnidadeImobiliariaEntity> cadastrarUnidade(@Valid @RequestBody UnidadeImobiliariaEntity unidade) {
        UnidadeImobiliariaEntity salva = vendasService.cadastrarUnidade(unidade);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/unidades-imobiliarias/projeto/{projetoId}")
    public ResponseEntity<List<UnidadeImobiliariaEntity>> listarPorProjeto(@PathVariable Long projetoId) {
        List<UnidadeImobiliariaEntity> unidades = vendasService.listarUnidadesPorProjeto(projetoId);
        return ResponseEntity.ok(unidades);
    }

    @PostMapping("/garantias-pos-venda")
    public ResponseEntity<GarantiaPosVendaEntity> abrirChamadoGarantia(@Valid @RequestBody GarantiaPosVendaEntity chamado) {
        GarantiaPosVendaEntity salvo = vendasService.abrirChamadoGarantia(chamado);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping("/garantias-pos-venda/unidade/{unidadeId}")
    public ResponseEntity<List<GarantiaPosVendaEntity>> listarGarantiasPorUnidade(@PathVariable Long unidadeId) {
        List<GarantiaPosVendaEntity> garantias = vendasService.listarGarantiasPorUnidade(unidadeId);
        return ResponseEntity.ok(garantias);
    }
}
