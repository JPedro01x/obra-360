package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.*;
import br.com.obra360.domain.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/gestao")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR','AUDITOR','ALMOXARIFE')")
public class GestaoFinanceiraController {
 private final FinanceiroObraService finance;private final PedidoMateriaisService orders;
 public GestaoFinanceiraController(FinanceiroObraService finance,PedidoMateriaisService orders){this.finance=finance;this.orders=orders;}
 private Long actor(Authentication a){return Long.valueOf(a.getName());}
 @GetMapping("/registros/{resource}") public Map<String,Object> list(@PathVariable String resource,@RequestParam(required=false) Long projetoObraId,@RequestParam(defaultValue="0") int page,Authentication a){
  if(!resource.equals("pedidos")&&a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_ALMOXARIFE")))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  return finance.list(resource,projetoObraId,page);
 }
 @GetMapping("/resumo/{project}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR','AUDITOR')")
 public Map<String,Object> summary(@PathVariable Long project){return finance.summary(project);}
 @PostMapping("/orcamentos") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
 public OrcamentoObraEntity budget(@Valid @RequestBody Budget r,Authentication a){return finance.budget(r.projetoObraId(),r.valorAprovado(),r.justificativa(),actor(a));}
 @PostMapping("/orcamentos/{id}/aprovar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
 public OrcamentoObraEntity approveBudget(@PathVariable Long id,@Valid @RequestBody Version r,Authentication a){return finance.approveBudget(id,r.versao(),actor(a));}
 @PostMapping("/titulos") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
 public TituloFinanceiroEntity title(@Valid @RequestBody Title r,Authentication a){return finance.title(r.projetoObraId(),r.tipo(),r.categoria(),r.descricao(),r.contraparte(),r.valor(),r.vencimento(),null,actor(a));}
 @PostMapping("/titulos/{id}/cancelar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
 public TituloFinanceiroEntity cancel(@PathVariable Long id,@Valid @RequestBody Version r,Authentication a){return finance.cancel(id,r.versao(),actor(a));}
 @PostMapping("/titulos/{id}/baixar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
 public BaixaFinanceiraEntity settle(@PathVariable Long id,@Valid @RequestBody Settlement r,Authentication a){return finance.settle(id,r.versao(),r.valor(),r.data(),r.conta(),r.observacao(),r.chave(),actor(a));}
 @PostMapping("/baixas/{id}/estornar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
 public BaixaFinanceiraEntity reverse(@PathVariable Long id,@Valid @RequestBody Reason r,Authentication a){return finance.reverse(id,r.versao(),r.justificativa(),actor(a));}
 @PostMapping("/extrato/importar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')") @Transactional
 public Map<String,Object> importBank(@Valid @RequestBody BankImport r,Authentication a){
  var rows=new ArrayList<ExtratoBancarioEntity>();for(var line:r.linhas())rows.add(finance.bank(r.projetoObraId(),r.conta(),line.identificador(),line.data(),line.descricao(),line.valor(),actor(a)));return Map.of("registros",rows.size());
 }
 @PostMapping("/extrato/{id}/conciliar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
 public ExtratoBancarioEntity reconcile(@PathVariable Long id,@Valid @RequestBody Reconcile r,Authentication a){return finance.reconcile(id,r.baixaId(),r.versao(),actor(a));}
 @GetMapping("/pedidos/{id}") public Map<String,Object> detail(@PathVariable Long id){return orders.details(id);}
 @PostMapping("/pedidos") @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
 public PedidoMateriaisEntity order(@Valid @RequestBody Order r,Authentication a){return orders.create(r.projetoObraId(),r.fornecedorB2bId(),r.justificativa(),r.referenciaProposta(),r.vencimento(),r.itens().stream().map(i->new PedidoMateriaisService.Line(i.itemEstoqueId(),i.quantidade(),i.valorUnitario())).toList(),actor(a));}
 @PostMapping("/pedidos/{id}/aprovar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
 public PedidoMateriaisEntity approve(@PathVariable Long id,@Valid @RequestBody Approval r,Authentication a){return orders.approve(id,r.versao(),r.alcada(),actor(a));}
 @PostMapping("/pedidos/{id}/emitir") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
 public PedidoMateriaisEntity issue(@PathVariable Long id,@Valid @RequestBody Version r,Authentication a){return orders.issue(id,r.versao(),actor(a));}
 @PostMapping("/pedidos/{id}/cancelar") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
 public PedidoMateriaisEntity cancelOrder(@PathVariable Long id,@Valid @RequestBody Version r,Authentication a){return orders.cancel(id,r.versao(),actor(a));}
 @PostMapping("/pedidos/{id}/{operation}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ALMOXARIFE')")
 public EventoPedidoEntity movement(@PathVariable Long id,@PathVariable String operation,@Valid @RequestBody Receipt r,Authentication a){
  String type=switch(operation){case "receber"->"RECEBER";case "devolver"->"DEVOLVER";default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);};
  return orders.movement(id,r.versao(),type,r.itens().stream().map(i->new PedidoMateriaisService.Quantity(i.itemId(),i.quantidade())).toList(),r.observacao(),r.chave(),actor(a));
 }
 public record Version(@Min(0) long versao){}
 public record Budget(@NotNull @Positive Long projetoObraId,@NotNull @DecimalMin("0.01") @Digits(integer=13,fraction=2) BigDecimal valorAprovado,@NotBlank @Size(min=10,max=1000) String justificativa){}
 public record Title(@NotNull @Positive Long projetoObraId,@NotBlank @Pattern(regexp="PAGAR|RECEBER") String tipo,@NotBlank @Pattern(regexp="MATERIAIS|MAO_DE_OBRA|SERVICOS|TAXAS|VENDAS|OUTROS") String categoria,@NotBlank @Size(max=250) String descricao,@NotBlank @Size(max=150) String contraparte,@NotNull @DecimalMin("0.01") @Digits(integer=13,fraction=2) BigDecimal valor,@NotNull LocalDate vencimento){}
 public record Settlement(@Min(0) long versao,@NotNull @DecimalMin("0.01") @Digits(integer=13,fraction=2) BigDecimal valor,@NotNull LocalDate data,@NotBlank @Size(max=80) String conta,@NotBlank @Size(min=5,max=500) String observacao,@NotBlank @Pattern(regexp="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}") String chave){}
 public record Reason(@Min(0) long versao,@NotBlank @Size(min=10,max=500) String justificativa){}
 public record BankLine(@NotBlank @Size(max=100) String identificador,@NotNull LocalDate data,@NotBlank @Size(max=250) String descricao,@NotNull @Digits(integer=13,fraction=2) BigDecimal valor){}
 public record BankImport(@NotNull @Positive Long projetoObraId,@NotBlank @Size(max=80) String conta,@NotNull @Size(min=1,max=500) List<@Valid BankLine> linhas){}
 public record Reconcile(@Min(0) long versao,@Positive Long baixaId){}
 public record OrderLine(@NotNull @Positive Long itemEstoqueId,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=8,fraction=4) BigDecimal quantidade,@NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal valorUnitario){}
 public record Order(@NotNull @Positive Long projetoObraId,@NotNull @Positive Long fornecedorB2bId,@NotBlank @Size(min=10,max=1000) String justificativa,@NotBlank @Size(max=150) String referenciaProposta,@NotNull LocalDate vencimento,@NotNull @Size(min=1,max=100) List<@Valid OrderLine> itens){}
 public record Approval(@Min(0) long versao,@NotBlank @Pattern(regexp="GESTAO|FINANCEIRO") String alcada){}
 public record ReceiptLine(@NotNull @Positive Long itemId,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=8,fraction=4) BigDecimal quantidade){}
 public record Receipt(@Min(0) long versao,@NotBlank @Size(min=10,max=1000) String observacao,@NotBlank @Pattern(regexp="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}") String chave,@NotNull @Size(min=1,max=100) List<@Valid ReceiptLine> itens){}
}
