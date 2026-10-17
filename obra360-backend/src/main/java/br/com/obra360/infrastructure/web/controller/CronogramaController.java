package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.CronogramaDomainService;
import br.com.obra360.domain.entity.EtapaCronogramaEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cronograma")
@RequiredArgsConstructor
public class CronogramaController {

    private final CronogramaDomainService cronogramaService;

    @PostMapping("/etapas")
    public ResponseEntity<EtapaCronogramaEntity> criarEtapa(@Valid @RequestBody EtapaCronogramaEntity etapa) {
        EtapaCronogramaEntity salva = cronogramaService.criarEtapa(etapa);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<EtapaCronogramaEntity>> listarPorProjeto(@PathVariable Long projetoId) {
        List<EtapaCronogramaEntity> etapas = cronogramaService.listarEtapasPorProjeto(projetoId);
        return ResponseEntity.ok(etapas);
    }

    @PatchMapping("/etapas/{etapaId}/progresso")
    public ResponseEntity<EtapaCronogramaEntity> atualizarProgresso(@PathVariable Long etapaId, @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal novoPercentual = payload.get("percentualExecutado");
        EtapaCronogramaEntity atualizada = cronogramaService.atualizarProgressoEtapa(etapaId, novoPercentual);
        return ResponseEntity.ok(atualizada);
    }

    @GetMapping("/projeto/{projetoId}/progresso-geral")
    public ResponseEntity<Map<String, BigDecimal>> obterProgressoGeral(@PathVariable Long projetoId) {
        BigDecimal progresso = cronogramaService.calcularProgressoGeralProjeto(projetoId);
        return ResponseEntity.ok(Map.of("progressoGeral", progresso));
    }
}
