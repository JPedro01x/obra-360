package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.time.*;

@RestController @RequestMapping("/api/v1/workspace") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','MESTRE_OBRA')")
public class OperacaoController {
    private final OperacaoService service;
    private Long actor(Authentication auth) { return Long.valueOf(auth.getName()); }
    @PostMapping("/equipes") @ResponseStatus(HttpStatus.CREATED)
    public EquipeTrabalhoEntity team(@Valid @RequestBody TeamRequest r,Authentication a) {
        return service.createTeam(r.projetoObraId(),r.liderEncarregadoId(),r.nomeEquipe(),r.especialidade(),r.quantidadeOperarios(),actor(a));
    }
    @PostMapping("/estoque") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ALMOXARIFE')")
    public ItemEstoqueEntity stock(@Valid @RequestBody StockRequest r,Authentication a) {
        return service.createStock(r.projetoObraId(),r.sku(),r.nome(),r.categoria(),r.unidadeMedida(),r.estoqueMinimo(),r.custoUnitarioMedio(),actor(a));
    }
    @PatchMapping("/estoque/{id}") @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ALMOXARIFE')")
    public ItemEstoqueEntity updateStock(@PathVariable Long id,@Valid @RequestBody StockUpdate r,Authentication a) {
        var item=service.stock(id,true);item.setNome(r.nome().trim());item.setCategoria(r.categoria().trim());item.setEstoqueMinimo(r.estoqueMinimo());item.setCustoUnitarioMedio(r.custoUnitarioMedio());
        service.audit("ATUALIZAR_MATERIAL","item_estoque",id,actor(a));return item;
    }
    @PostMapping("/fornecedores") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
    public FornecedorB2BEntity supplier(@Valid @RequestBody SupplierRequest r,Authentication a) {
        return service.createSupplier(r.cnpj(),r.razaoSocial(),r.categoriaFornecimento(),actor(a));
    }
    @PostMapping("/contratos") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
    public ContratoServicoEntity contract(@Valid @RequestBody ContractRequest r,Authentication a) {
        return service.createContract(r.projetoObraId(),r.fornecedorB2bId(),r.numeroContrato(),r.valorTotal(),r.retencaoTecnicaPct(),r.tempoLimiteSlaHoras(),r.dataInicio(),r.dataTermino(),actor(a));
    }
    @PostMapping("/ordens") @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoServicoEntity order(@Valid @RequestBody OrderRequest r,Authentication a) {
        return service.createOrder(r.contratoServicoId(),r.equipeTrabalhoId(),r.descricao(),r.prioridade(),r.dataLimiteSla(),r.exigeMaterial(),actor(a));
    }
    @PatchMapping("/contratos/{id}/ativo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
    public ContratoServicoEntity contractState(@PathVariable Long id,@Valid @RequestBody ContractState r,Authentication a) {
        return service.contractState(id,r.ativo(),actor(a));
    }
    @PostMapping("/ordens/{id}/justificativa")
    public SolicitacaoServicoEntity justify(@PathVariable Long id,@Valid @RequestBody ClosureRequest r,Authentication a) {
        return service.requestLateClosure(id,r.justificativa(),actor(a));
    }
    @PostMapping("/ordens/{id}/aprovar-encerramento")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ENGENHEIRO','GERENTE_OBRA')")
    public SolicitacaoServicoEntity approve(@PathVariable Long id,Authentication a) {return service.approveLateClosure(id,actor(a));}
    @PatchMapping("/ordens/{id}/status")
    public SolicitacaoServicoEntity status(@PathVariable Long id,@Valid @RequestBody StatusRequest r,Authentication a) {
        return service.changeOrder(id,r.status(),actor(a));
    }
    @PostMapping("/movimentacoes") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ALMOXARIFE')")
    public MovimentacaoEstoqueEntity movement(@Valid @RequestBody MovementRequest r,Authentication a) {
        return service.movement(r.itemEstoqueId(),r.tipoMovimentacao(),r.quantidade(),r.ordemServicoId(),r.chaveOperacao(),actor(a));
    }
    public record TeamRequest(@NotNull @Positive Long projetoObraId,@NotNull @Positive Long liderEncarregadoId,
        @NotBlank @Size(max=100) String nomeEquipe,@NotBlank @Size(max=100) String especialidade,@Min(1) @Max(10000) int quantidadeOperarios) {}
    public record StockUpdate(@NotBlank @Size(max=150) String nome,@NotBlank @Size(max=80) String categoria,
        @NotNull @DecimalMin("0") @Digits(integer=8,fraction=4) BigDecimal estoqueMinimo,@NotNull @DecimalMin("0") @Digits(integer=10,fraction=2) BigDecimal custoUnitarioMedio) {}
    public record StockRequest(@NotNull @Positive Long projetoObraId,@NotBlank @Size(max=50) String sku,@NotBlank @Size(max=150) String nome,
        @NotBlank @Size(max=80) String categoria,@NotBlank @Size(max=20) String unidadeMedida,
        @NotNull @DecimalMin("0") @Digits(integer=8,fraction=4) BigDecimal estoqueMinimo,@NotNull @DecimalMin("0") @Digits(integer=10,fraction=2) BigDecimal custoUnitarioMedio) {}
    public record SupplierRequest(@NotBlank @Pattern(regexp="[A-Za-z0-9]{12}[0-9]{2}") String cnpj,
        @NotBlank @Size(max=255) String razaoSocial,@NotBlank @Pattern(regexp="INSUMOS|FROTAS|SERVICOS") String categoriaFornecimento) {}
    public record ContractRequest(@NotNull @Positive Long projetoObraId,@NotNull @Positive Long fornecedorB2bId,
        @NotBlank @Size(max=50) String numeroContrato,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorTotal,
        @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal retencaoTecnicaPct,
        @Min(1) @Max(87600) int tempoLimiteSlaHoras,@NotNull LocalDate dataInicio,@NotNull LocalDate dataTermino) {}
    public record OrderRequest(@NotNull @Positive Long contratoServicoId,@NotNull @Positive Long equipeTrabalhoId,
        @NotBlank @Size(max=10000) String descricao,@NotBlank @Pattern(regexp="BAIXA|MEDIA|ALTA|URGENTE") String prioridade,@Future OffsetDateTime dataLimiteSla,boolean exigeMaterial) {}
    public record ContractState(@NotNull Boolean ativo) {}
    public record ClosureRequest(@NotBlank @Size(min=10,max=2000) String justificativa) {}
    public record StatusRequest(@NotBlank @Pattern(regexp="EM_ANDAMENTO|CONCLUIDO|CANCELADO") String status) {}
    public record MovementRequest(@NotNull @Positive Long itemEstoqueId,@NotBlank @Pattern(regexp="ENTRADA|SAIDA|CONSUMO_OS") String tipoMovimentacao,
        @NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=8,fraction=4) BigDecimal quantidade,@Positive Long ordemServicoId,
        @NotBlank @Pattern(regexp="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}") String chaveOperacao) {}
}
