package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.NfeReceiptService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workspace/notas-fiscais")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','ALMOXARIFE','AUDITOR')")
public class NfeWorkspaceController {
    private final NfeReceiptService service;

    @GetMapping
    public NfeReceiptService.InvoicePage list(@RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size, @RequestParam(defaultValue = "") String q) {
        return service.list(page, size, q);
    }

    @GetMapping("/{id}")
    public NfeReceiptService.InvoiceDetail detail(@PathVariable Long id) { return service.detail(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','ALMOXARIFE')")
    public NfeReceiptService.InvoiceSummary create(@Valid @RequestBody CreateInvoice request, Authentication auth) {
        return service.create(new NfeReceiptService.CreateInvoice(request.chaveNfe(), request.fornecedorId(),
            request.numero(), request.dataEmissao(), request.valorTotal(), request.itens().stream()
                .map(i -> new NfeReceiptService.InvoiceItemInput(i.itemEstoqueId(), i.quantidade(), i.valorUnitario())).toList()),
            Long.valueOf(auth.getName()));
    }

    @PostMapping("/{id}/registrar-entrada")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ALMOXARIFE')")
    public NfeReceiptService.InvoiceSummary registerStockEntry(@PathVariable Long id, Authentication auth) {
        return service.registerStockEntry(id, Long.valueOf(auth.getName()));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','ALMOXARIFE')")
    public NfeReceiptService.InvoiceSummary cancelPending(@PathVariable Long id, @Valid @RequestBody CancelInvoice request, Authentication auth) {
        return service.cancelPending(id, Long.valueOf(auth.getName()), request.justificativa());
    }

    public record CreateInvoice(@NotBlank @Pattern(regexp = "[0-9]{44}") String chaveNfe,
        @NotNull @Positive Long fornecedorId, @NotBlank @Size(max = 30) String numero,
        @NotNull LocalDate dataEmissao, @NotNull @DecimalMin(value = "0.01") @Digits(integer = 12, fraction = 2) BigDecimal valorTotal,
        @NotEmpty @Size(max = 100) List<@Valid InvoiceItem> itens) {}

    public record InvoiceItem(@NotNull @Positive Long itemEstoqueId,
        @NotNull @DecimalMin(value = "0.0001") @Digits(integer = 8, fraction = 4) BigDecimal quantidade,
        @NotNull @DecimalMin(value = "0.00") @Digits(integer = 10, fraction = 2) BigDecimal valorUnitario) {}

    public record CancelInvoice(@NotBlank @Size(min = 10, max = 300) String justificativa) {}
}
