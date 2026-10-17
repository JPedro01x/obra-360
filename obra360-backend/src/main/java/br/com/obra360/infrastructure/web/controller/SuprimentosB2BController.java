package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.SuprimentosB2BService;
import br.com.obra360.domain.entity.CotacaoB2BEntity;
import br.com.obra360.domain.entity.FornecedorB2BEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suprimentos-b2b")
@RequiredArgsConstructor
public class SuprimentosB2BController {

    private final SuprimentosB2BService suprimentosService;

    @PostMapping("/fornecedores")
    public ResponseEntity<FornecedorB2BEntity> cadastrarFornecedor(@Valid @RequestBody FornecedorB2BEntity fornecedor) {
        FornecedorB2BEntity salvo = suprimentosService.cadastrarFornecedor(fornecedor);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping("/fornecedores/categoria/{categoria}")
    public ResponseEntity<List<FornecedorB2BEntity>> listarPorCategoria(@PathVariable String categoria) {
        List<FornecedorB2BEntity> fornecedores = suprimentosService.listarFornecedoresPorCategoria(categoria);
        return ResponseEntity.ok(fornecedores);
    }

    @PostMapping("/cotacoes")
    public ResponseEntity<CotacaoB2BEntity> submeterCotacao(@Valid @RequestBody CotacaoB2BEntity cotacao) {
        CotacaoB2BEntity salva = suprimentosService.submeterCotacao(cotacao);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/cotacoes/empresa/{empresaId}")
    public ResponseEntity<List<CotacaoB2BEntity>> listarCotacoesEmpresa(@PathVariable Long empresaId) {
        List<CotacaoB2BEntity> cotacoes = suprimentosService.listarCotacoesPorEmpresa(empresaId);
        return ResponseEntity.ok(cotacoes);
    }
}
