package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.EmpresaEntity;
import br.com.obra360.domain.repository.EmpresaRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empresas")
@RequiredArgsConstructor
public class EmpresaController {

    private final EmpresaRepository empresaRepository;

    @GetMapping
    public ResponseEntity<List<EmpresaEntity>> listarTodas() {
        return ResponseEntity.ok(empresaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaEntity> buscarPorId(@PathVariable Long id) {
        return empresaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmpresaEntity> cadastrar(@Valid @RequestBody EmpresaEntity empresa) {
        EmpresaEntity salva = empresaRepository.save(empresa);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }
}
