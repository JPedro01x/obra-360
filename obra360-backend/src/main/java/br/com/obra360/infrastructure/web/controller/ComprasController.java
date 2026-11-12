package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.ComprasService;
import br.com.obra360.domain.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController @RequestMapping("/api/v1/workspace/compras")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
public class ComprasController {
    private final ComprasService service;
    public ComprasController(ComprasService service) {this.service=service;}
    private Long actor(Authentication a) {return Long.valueOf(a.getName());}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public RequisicaoCompraEntity create(@Valid @RequestBody Request r,Authentication a) {
        return service.create(r.itemEstoqueId(),r.quantidade(),r.justificativa(),actor(a));
    }
    @PostMapping("/{id}/propostas") @ResponseStatus(HttpStatus.CREATED)
    public CotacaoB2BEntity proposal(@PathVariable Long id,@Valid @RequestBody Proposal r,Authentication a) {
        return service.proposal(id,r.fornecedorB2bId(),r.valorProposta(),r.prazoEntregaDias(),actor(a));
    }
    @PostMapping("/{id}/selecionar")
    public RequisicaoCompraEntity select(@PathVariable Long id,@Valid @RequestBody Selection r,Authentication a) {return service.select(id,r.cotacaoId(),actor(a));}
    @PostMapping("/{id}/aprovar")
    public RequisicaoCompraEntity approve(@PathVariable Long id,@Valid @RequestBody Approval r,Authentication a) {return service.approve(id,r.alcada(),actor(a));}
    @PostMapping("/{id}/pedido")
    public RequisicaoCompraEntity issue(@PathVariable Long id,Authentication a) {return service.issue(id,actor(a));}
    @PostMapping("/{id}/receber")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ALMOXARIFE')")
    public RequisicaoCompraEntity receive(@PathVariable Long id,Authentication a) {return service.receive(id,actor(a));}
    @PostMapping("/{id}/cancelar")
    public RequisicaoCompraEntity cancel(@PathVariable Long id,Authentication a) {return service.cancel(id,actor(a));}
    public record Request(@NotNull @Positive Long itemEstoqueId,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=8,fraction=4) BigDecimal quantidade,
        @NotBlank @Size(min=10,max=1000) String justificativa) {}
    public record Proposal(@NotNull @Positive Long fornecedorB2bId,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=12,fraction=2) BigDecimal valorProposta,
        @Min(0) @Max(3650) int prazoEntregaDias) {}
    public record Selection(@NotNull @Positive Long cotacaoId) {}
    public record Approval(@NotBlank @Pattern(regexp="GESTAO|FINANCEIRO") String alcada) {}
}
