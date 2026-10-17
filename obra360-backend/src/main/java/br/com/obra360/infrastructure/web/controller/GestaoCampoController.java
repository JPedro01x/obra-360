package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.GestaoCampoService;
import br.com.obra360.domain.entity.EquipeTrabalhoEntity;
import br.com.obra360.domain.entity.SolicitacaoServicoEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gestao-campo")
@RequiredArgsConstructor
public class GestaoCampoController {

    private final GestaoCampoService gestaoCampoService;

    @PostMapping("/equipes")
    public ResponseEntity<EquipeTrabalhoEntity> cadastrarEquipe(@Valid @RequestBody EquipeTrabalhoEntity equipe) {
        EquipeTrabalhoEntity salva = gestaoCampoService.cadastrarEquipe(equipe);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/equipes/projeto/{projetoId}")
    public ResponseEntity<List<EquipeTrabalhoEntity>> listarEquipesPorProjeto(@PathVariable Long projetoId) {
        List<EquipeTrabalhoEntity> equipes = gestaoCampoService.listarEquipesPorProjeto(projetoId);
        return ResponseEntity.ok(equipes);
    }

    @PostMapping("/ordens-servico")
    public ResponseEntity<SolicitacaoServicoEntity> criarOrdemServico(@Valid @RequestBody SolicitacaoServicoEntity os) {
        SolicitacaoServicoEntity salva = gestaoCampoService.criarOrdemServico(os);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/ordens-servico/contrato/{contratoId}")
    public ResponseEntity<List<SolicitacaoServicoEntity>> listarOrdensPorContrato(@PathVariable Long contratoId) {
        List<SolicitacaoServicoEntity> ordens = gestaoCampoService.listarOrdensPorContrato(contratoId);
        return ResponseEntity.ok(ordens);
    }

    @PatchMapping("/ordens-servico/{id}/encerrar")
    public ResponseEntity<SolicitacaoServicoEntity> encerrarOrdemServico(@PathVariable Long id) {
        SolicitacaoServicoEntity encerrada = gestaoCampoService.encerrarOrdemServico(id);
        return ResponseEntity.ok(encerrada);
    }
}
