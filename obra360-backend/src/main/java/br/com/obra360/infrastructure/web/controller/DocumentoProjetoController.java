package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.DocumentoProjetoEntity;
import br.com.obra360.domain.repository.DocumentoProjetoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documentos")
@RequiredArgsConstructor
public class DocumentoProjetoController {

    private final DocumentoProjetoRepository documentoProjetoRepository;

    @GetMapping
    public ResponseEntity<List<DocumentoProjetoEntity>> listarTodos() {
        return ResponseEntity.ok(documentoProjetoRepository.findAll());
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<DocumentoProjetoEntity>> listarPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.ok(documentoProjetoRepository.findByProjetoObraId(projetoId));
    }

    @PostMapping
    public ResponseEntity<DocumentoProjetoEntity> cadastrar(@Valid @RequestBody DocumentoProjetoEntity documento) {
        DocumentoProjetoEntity salvo = documentoProjetoRepository.save(documento);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
