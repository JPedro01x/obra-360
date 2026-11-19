package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.SolicitacaoAtendimentoEntity;
import br.com.obra360.application.service.AtendimentoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController @RequestMapping("/api/v1/workspace/atendimento")
@RequiredArgsConstructor @PreAuthorize("isAuthenticated()")
public class AtendimentoController {
    private final AtendimentoService service;
    @GetMapping public List<SolicitacaoAtendimentoEntity> list(Authentication a) { return service.list(a); }
    @GetMapping("/pagina") public AtendimentoService.Pagina page(Authentication a,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
        @RequestParam(required=false) String status, @RequestParam(required=false) String categoria) {
        return service.page(a,page,size,status,categoria);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoAtendimentoEntity create(@Valid @RequestBody NovaSolicitacao r,Authentication a) { return service.create(r,a); }
    @PatchMapping("/{id}") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SolicitacaoAtendimentoEntity update(@PathVariable Long id,@Valid @RequestBody Resposta r,Authentication a) { return service.update(id,r,a); }
    public record NovaSolicitacao(@NotBlank String categoria,@NotBlank @Size(max=150) String assunto,@NotBlank @Size(max=4000) String descricao) {}
    public record Resposta(@NotBlank String status,@NotBlank @Size(max=4000) String resposta,@Min(0) long versao) {}
}
