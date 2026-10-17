package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.EstoqueService;
import br.com.obra360.domain.entity.MovimentacaoEstoqueEntity;
import br.com.obra360.infrastructure.web.dto.EntradaNfeDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @PostMapping("/movimentacao/nfe")
    public ResponseEntity<MovimentacaoEstoqueEntity> registrarEntradaNfe(
            @Valid @RequestBody EntradaNfeDTO dto,
            @RequestHeader(value = "X-Usuario-ID", defaultValue = "1") Long usuarioId) {

        MovimentacaoEstoqueEntity movimentacao = estoqueService.processarEntradaNfe(dto, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }
}
