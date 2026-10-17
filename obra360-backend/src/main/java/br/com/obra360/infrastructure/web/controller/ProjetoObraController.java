package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.ProjetoObraEntity;
import br.com.obra360.domain.repository.ProjetoObraRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projetos")
@RequiredArgsConstructor
public class ProjetoObraController {

    private final ProjetoObraRepository projetoObraRepository;

    @GetMapping
    public ResponseEntity<List<ProjetoObraEntity>> listarTodos() {
        return ResponseEntity.ok(projetoObraRepository.findAll());
    }

    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<List<ProjetoObraEntity>> listarPorEmpresa(@PathVariable Long empresaId) {
        return ResponseEntity.ok(projetoObraRepository.findByEmpresaId(empresaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetoObraEntity> buscarPorId(@PathVariable Long id) {
        return projetoObraRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProjetoObraEntity> cadastrar(@Valid @RequestBody ProjetoObraEntity projeto) {
        ProjetoObraEntity salvo = projetoObraRepository.save(projeto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
