package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.QualidadeSegurancaService;
import br.com.obra360.domain.entity.OcorrenciaQualidadeEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/qualidade-seguranca")
@RequiredArgsConstructor
public class QualidadeSegurancaController {

    private final QualidadeSegurancaService qualidadeService;

    @PostMapping("/ocorrencias")
    public ResponseEntity<OcorrenciaQualidadeEntity> registrarOcorrencia(@Valid @RequestBody OcorrenciaQualidadeEntity ocorrencia) {
        OcorrenciaQualidadeEntity salva = qualidadeService.registrarOcorrencia(ocorrencia);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/ocorrencias/projeto/{projetoId}")
    public ResponseEntity<List<OcorrenciaQualidadeEntity>> listarPorProjeto(@PathVariable Long projetoId) {
        List<OcorrenciaQualidadeEntity> ocorrencias = qualidadeService.listarPorProjeto(projetoId);
        return ResponseEntity.ok(ocorrencias);
    }

    @PatchMapping("/ocorrencias/{id}/status")
    public ResponseEntity<OcorrenciaQualidadeEntity> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoStatus = payload.get("statusPlanoAcao");
        OcorrenciaQualidadeEntity atualizada = qualidadeService.atualizarStatusPlanoAcao(id, novoStatus);
        return ResponseEntity.ok(atualizada);
    }
}
