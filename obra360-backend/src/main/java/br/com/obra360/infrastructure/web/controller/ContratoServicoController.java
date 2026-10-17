package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.ContratoServicoEntity;
import br.com.obra360.domain.repository.ContratoServicoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contratos")
@RequiredArgsConstructor
public class ContratoServicoController {

    private final ContratoServicoRepository contratoServicoRepository;

    @GetMapping
    public ResponseEntity<List<ContratoServicoEntity>> listarTodos() {
        return ResponseEntity.ok(contratoServicoRepository.findAll());
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<ContratoServicoEntity>> listarPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.ok(contratoServicoRepository.findByProjetoObraId(projetoId));
    }

    @PostMapping
    public ResponseEntity<ContratoServicoEntity> cadastrar(@Valid @RequestBody ContratoServicoEntity contrato) {
        ContratoServicoEntity salvo = contratoServicoRepository.save(contrato);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
