package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.domain.service.ValidadorSefazDomainService;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceException;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NfeReceiptService {
    private static final BigDecimal MAX_INVOICE_TOTAL = new BigDecimal("999999999999.99");
    private final EntityManager em;
    private final ValidadorSefazDomainService keyValidator;
    private final OperacaoService operation;

    public InvoicePage list(int page, int size, String query) {
        if (page < 0 || page > 1_000_000 || size < 1 || size > 100 || query.length() > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        Long tenant = tenant();
        String filter = query.isBlank() ? "" : " and (lower(n.numero) like :q or lower(n.fornecedor.razaoSocial) like :q or n.chaveNfe like :q)";
        TypedQuery<NfeDocumentoEntity> rows = em.createQuery(
            "select n from NfeDocumentoEntity n join fetch n.fornecedor where n.empresa.id=:tenant" + filter + " order by n.criadoEm desc, n.id desc",
            NfeDocumentoEntity.class).setParameter("tenant", tenant).setFirstResult(page * size).setMaxResults(size);
        TypedQuery<Long> count = em.createQuery(
            "select count(n) from NfeDocumentoEntity n where n.empresa.id=:tenant" + filter, Long.class).setParameter("tenant", tenant);
        if (!query.isBlank()) { rows.setParameter("q", "%" + query.toLowerCase(Locale.ROOT) + "%"); count.setParameter("q", "%" + query.toLowerCase(Locale.ROOT) + "%"); }
        List<NfeDocumentoEntity> documents = rows.getResultList();
        Map<Long, Long> counts = new HashMap<>();
        if (!documents.isEmpty()) {
            List<Long> ids = documents.stream().map(NfeDocumentoEntity::getId).toList();
            em.createQuery("select i.documento.id, count(i) from NfeItemEntity i where i.documento.id in :ids group by i.documento.id", Object[].class)
                .setParameter("ids", ids).getResultList().forEach(row -> counts.put((Long) row[0], (Long) row[1]));
        }
        List<InvoiceSummary> items = documents.stream().map(n -> new InvoiceSummary(
            n.getId(), n.getChaveNfe(), n.getNumero(), n.getFornecedor().getRazaoSocial(), n.getDataEmissao(),
            n.getValorTotal(), n.getStatus(), counts.getOrDefault(n.getId(), 0L), n.getCriadoEm())).toList();
        return new InvoicePage(items, count.getSingleResult(), page, size);
    }

    public InvoiceDetail detail(Long id) {
        NfeDocumentoEntity document = find(id, LockModeType.NONE);
        List<InvoiceLine> lines = em.createQuery(
            "select i.itemEstoque.id, i.itemEstoque.sku, i.itemEstoque.nome, i.itemEstoque.unidadeMedida, i.quantidade, i.valorUnitario, i.valorTotal " +
                "from NfeItemEntity i where i.documento.id=:id order by i.id", Object[].class)
            .setParameter("id", id).getResultList().stream().map(row -> new InvoiceLine(
                (Long) row[0], (String) row[1], (String) row[2], (String) row[3], (BigDecimal) row[4], (BigDecimal) row[5], (BigDecimal) row[6])).toList();
        List<InvoiceEvent> events = em.createQuery(
            "select e.tipo, e.observacao, e.usuario.nome, e.criadoEm from NfeEventoEntity e where e.documento.id=:id order by e.criadoEm desc, e.id desc", Object[].class)
            .setParameter("id", id).getResultList().stream().map(row -> new InvoiceEvent(
                (String) row[0], (String) row[1], (String) row[2], (OffsetDateTime) row[3])).toList();
        return new InvoiceDetail(summary(document), lines, events);
    }

    @Transactional
    public InvoiceSummary create(CreateInvoice request, Long actor) {
        Long tenant = tenant();
        if (!keyValidator.validarChaveNfe44Digitos(request.chaveNfe()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A chave informada não passou na validação matemática do dígito verificador.");
        if (request.dataEmissao().isAfter(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data de emissão não pode estar no futuro.");
        if (request.itens().isEmpty() || request.itens().size() > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe de 1 a 100 itens distintos da nota.");

        FornecedorB2BEntity supplier = em.find(FornecedorB2BEntity.class, request.fornecedorId());
        if (supplier == null || !tenant.equals(supplier.getEmpresaId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O fornecedor deve estar cadastrado na empresa atual.");
        UsuarioEntity user = em.find(UsuarioEntity.class, actor);
        if (user == null || !tenant.equals(user.getEmpresaId()) || !Boolean.TRUE.equals(user.getAtivo()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        Set<Long> stockIds = new HashSet<>();
        BigDecimal lineSum = BigDecimal.ZERO.setScale(2);
        for (InvoiceItemInput line : request.itens()) {
            if (!stockIds.add(line.itemEstoqueId()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada material pode aparecer uma única vez; some as quantidades em uma linha.");
            BigDecimal value = line.quantidade().multiply(line.valorUnitario()).setScale(2, RoundingMode.HALF_UP);
            if (value.compareTo(MAX_INVOICE_TOTAL) > 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor de uma linha excede o limite permitido.");
            lineSum = lineSum.add(value);
            if (lineSum.compareTo(MAX_INVOICE_TOTAL) > 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A soma dos itens excede o limite permitido.");
        }
        BigDecimal declaredTotal = request.valorTotal().setScale(2, RoundingMode.UNNECESSARY);
        if (lineSum.compareTo(declaredTotal) != 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A soma dos itens não confere com o valor total da nota.");

        List<ItemEstoqueEntity> stockRows = em.createQuery(
            "select i from ItemEstoqueEntity i where i.empresaId=:tenant and i.id in :ids order by i.id", ItemEstoqueEntity.class)
            .setParameter("tenant", tenant).setParameter("ids", stockIds).getResultList();
        if (stockRows.size() != stockIds.size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos os materiais devem pertencer à empresa atual.");

        NfeDocumentoEntity document = new NfeDocumentoEntity();
        document.setEmpresa(em.getReference(EmpresaEntity.class, tenant));
        document.setFornecedor(supplier);
        document.setCriadoPor(user);
        document.setChaveNfe(request.chaveNfe());
        document.setNumero(request.numero().trim());
        document.setDataEmissao(request.dataEmissao());
        document.setValorTotal(declaredTotal);
        document.setStatus("PENDENTE_CONFERENCIA");
        em.persist(document);
        em.flush();
        for (InvoiceItemInput input : request.itens()) {
            ItemEstoqueEntity stock = stockRows.stream().filter(s -> s.getId().equals(input.itemEstoqueId())).findFirst().orElseThrow();
            NfeItemEntity line = new NfeItemEntity();
            line.setDocumento(document);
            line.setItemEstoque(stock);
            line.setQuantidade(input.quantidade());
            line.setValorUnitario(input.valorUnitario());
            line.setValorTotal(input.quantidade().multiply(input.valorUnitario()).setScale(2, RoundingMode.HALF_UP));
            em.persist(line);
        }
        event(document, user, "CADASTRADA", "Dados lançados manualmente; autorização da SEFAZ não foi consultada.");
        operation.audit("CADASTRAR_NFE_LOCAL", "documento_nfe", document.getId(), actor);
        try { em.flush(); }
        catch (RuntimeException ex) {
            if (isUniqueViolation(ex))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta chave de NF-e ou combinação de itens já foi cadastrada nesta empresa.");
            throw ex;
        }
        return summary(document);
    }

    @Transactional
    public InvoiceSummary registerStockEntry(Long id, Long actor) {
        NfeDocumentoEntity document = find(id, LockModeType.PESSIMISTIC_WRITE);
        if (!"PENDENTE_CONFERENCIA".equals(document.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A entrada desta nota já foi registrada ou ela não está pendente.");
        UsuarioEntity user = em.find(UsuarioEntity.class, actor);
        if (user == null || !tenant().equals(user.getEmpresaId()) || !Boolean.TRUE.equals(user.getAtivo()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        List<NfeItemEntity> lines = em.createQuery(
            "select l from NfeItemEntity l where l.documento.id=:id order by l.itemEstoque.id", NfeItemEntity.class)
            .setParameter("id", id).getResultList();
        for (NfeItemEntity line : lines) {
            ItemEstoqueEntity stock = em.find(ItemEstoqueEntity.class, line.getItemEstoque().getId(), LockModeType.PESSIMISTIC_WRITE);
            if (stock == null || !tenant().equals(stock.getEmpresaId()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Um material da nota não está mais disponível nesta empresa.");
            BigDecimal oldQuantity = stock.getQuantidadeAtual();
            BigDecimal newQuantity = oldQuantity.add(line.getQuantidade());
            if (newQuantity.compareTo(new BigDecimal("99999999.9999")) > 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A entrada excede o saldo máximo do material " + stock.getSku() + ".");
            BigDecimal oldValue = oldQuantity.multiply(stock.getCustoUnitarioMedio());
            BigDecimal purchaseValue = line.getValorTotal();
            BigDecimal averageCost = newQuantity.signum() == 0 ? stock.getCustoUnitarioMedio()
                : oldValue.add(purchaseValue).divide(newQuantity, 2, RoundingMode.HALF_UP);
            stock.setQuantidadeAtual(newQuantity);
            stock.setCustoUnitarioMedio(averageCost);
            MovimentacaoEstoqueEntity movement = MovimentacaoEstoqueEntity.builder()
                .itemEstoqueId(stock.getId()).usuarioId(actor).tipoMovimentacao("ENTRADA_NFE")
                .quantidade(line.getQuantidade()).valorTotal(purchaseValue).chaveNfe44Digitos(document.getChaveNfe())
                .documentoNfe(document).chaveOperacao(UUID.randomUUID().toString()).build();
            em.persist(movement);
        }
        document.setStatus("ENTRADA_REGISTRADA");
        event(document, user, "ENTRADA_REGISTRADA", "Itens e saldos do almoxarifado foram atualizados localmente.");
        operation.audit("REGISTRAR_ENTRADA_NFE", "documento_nfe", id, actor);
        return summary(document);
    }

    @Transactional
    public InvoiceSummary cancelPending(Long id, Long actor, String reason) {
        NfeDocumentoEntity document = find(id, LockModeType.PESSIMISTIC_WRITE);
        if (!"PENDENTE_CONFERENCIA".equals(document.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Somente uma nota pendente pode ser cancelada; entradas registradas exigem estorno auditado.");
        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.length() < 10 || normalizedReason.length() > 300)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma justificativa de 10 a 300 caracteres.");
        UsuarioEntity user = em.find(UsuarioEntity.class, actor);
        if (user == null || !tenant().equals(user.getEmpresaId()) || !Boolean.TRUE.equals(user.getAtivo()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        document.setStatus("CANCELADA");
        event(document, user, "CANCELADA", normalizedReason);
        operation.audit("CANCELAR_NFE_PENDENTE", "documento_nfe", id, actor);
        return summary(document);
    }

    private NfeDocumentoEntity find(Long id, LockModeType lock) {
        if (id == null || id < 1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        List<NfeDocumentoEntity> rows = em.createQuery(
            "select n from NfeDocumentoEntity n where n.id=:id and n.empresa.id=:tenant", NfeDocumentoEntity.class)
            .setParameter("id", id).setParameter("tenant", tenant()).setLockMode(lock).getResultList();
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota fiscal não encontrada nesta empresa.");
        return rows.getFirst();
    }

    private long itemCount(Long id) {
        return em.createQuery("select count(i) from NfeItemEntity i where i.documento.id=:id", Long.class).setParameter("id", id).getSingleResult();
    }

    private boolean isUniqueViolation(Throwable error) {
        for (Throwable cause = error; cause != null && cause.getCause() != cause; cause = cause.getCause()) {
            if (cause instanceof java.sql.SQLException sql && "23505".equals(sql.getSQLState())) return true;
            if (cause instanceof org.hibernate.exception.ConstraintViolationException violation &&
                violation.getConstraintName() != null && violation.getConstraintName().equalsIgnoreCase("uk_documento_nfe_empresa_chave")) return true;
        }
        return false;
    }

    private void event(NfeDocumentoEntity document, UsuarioEntity user, String type, String observation) {
        NfeEventoEntity event = new NfeEventoEntity();
        event.setDocumento(document); event.setUsuario(user); event.setTipo(type); event.setObservacao(observation);
        em.persist(event);
    }

    private InvoiceSummary summary(NfeDocumentoEntity document) {
        return new InvoiceSummary(document.getId(), document.getChaveNfe(), document.getNumero(),
            document.getFornecedor().getRazaoSocial(), document.getDataEmissao(), document.getValorTotal(),
            document.getStatus(), itemCount(document.getId()), document.getCriadoEm());
    }

    private Long tenant() {
        Long tenant = TenantContext.getCurrentTenant();
        if (tenant == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return tenant;
    }

    public record InvoicePage(List<InvoiceSummary> items, Long total, int page, int size) {}
    public record InvoiceSummary(Long id, String chaveNfe, String numero, String fornecedor, LocalDate dataEmissao,
                                 BigDecimal valorTotal, String status, Long quantidadeItens, OffsetDateTime criadoEm) {}
    public record InvoiceLine(Long itemEstoqueId, String sku, String nome, String unidadeMedida,
                              BigDecimal quantidade, BigDecimal valorUnitario, BigDecimal valorTotal) {}
    public record InvoiceEvent(String tipo, String observacao, String usuario, OffsetDateTime criadoEm) {}
    public record InvoiceDetail(InvoiceSummary documento, List<InvoiceLine> itens, List<InvoiceEvent> eventos) {}
    public record CreateInvoice(String chaveNfe, Long fornecedorId, String numero, LocalDate dataEmissao,
                                BigDecimal valorTotal, List<InvoiceItemInput> itens) {}
    public record InvoiceItemInput(Long itemEstoqueId, BigDecimal quantidade, BigDecimal valorUnitario) {}
}
