package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.OffsetDateTime;
import java.util.*;

@Service @Transactional
public class ComprasService {
    private final EntityManager em;
    private final OperacaoService operations;
    public ComprasService(EntityManager em,OperacaoService operations) {this.em=em;this.operations=operations;}
    private Long tenant() {return Objects.requireNonNull(TenantContext.getCurrentTenant());}
    private ResponseStatusException conflict(String message) {return new ResponseStatusException(HttpStatus.CONFLICT,message);}
    private RequisicaoCompraEntity find(Long id) {
        var r=em.find(RequisicaoCompraEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(r==null || !tenant().equals(r.getEmpresaId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return r;
    }
    private void state(RequisicaoCompraEntity r,String expected) {
        if(!expected.equals(r.getStatus())) throw conflict("Operação indisponível na situação atual da compra.");
    }
    public RequisicaoCompraEntity create(Long itemId,BigDecimal quantity,String reason,Long actor) {
        operations.stock(itemId,false);
        var r=new RequisicaoCompraEntity();r.setEmpresaId(tenant());r.setItemEstoqueId(itemId);r.setQuantidade(quantity);
        r.setJustificativa(reason.trim());r.setSolicitanteId(actor);r.setStatus("COTACAO");r.setDataCriacao(OffsetDateTime.now());
        em.persist(r);operations.audit("CRIAR_REQUISICAO","requisicao_compra",r.getId(),actor);return r;
    }
    public CotacaoB2BEntity proposal(Long id,Long supplierId,BigDecimal total,int days,Long actor) {
        var r=find(id);state(r,"COTACAO");
        var supplier=em.find(FornecedorB2BEntity.class,supplierId,LockModeType.PESSIMISTIC_WRITE);
        if(supplier==null || !tenant().equals(supplier.getEmpresaId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        boolean duplicate=em.createQuery("select count(c) from CotacaoB2BEntity c where c.requisicaoCompraId=:id and c.fornecedorB2bId=:supplier",Long.class)
            .setParameter("id",id).setParameter("supplier",supplierId).getSingleResult()>0;
        if(duplicate) throw conflict("Este fornecedor já tem proposta nesta requisição.");
        var q=CotacaoB2BEntity.builder().empresaId(tenant()).requisicaoCompraId(id).fornecedorB2bId(supplierId)
            .codigoCotacao("CP-"+UUID.randomUUID().toString().replace("-","").substring(0,24)).valorProposta(total)
            .prazoEntregaDias(days).statusCotacao("EM_ANALISE").build();
        em.persist(q);operations.audit("COTAR_COMPRA","requisicao_compra",id,actor);return q;
    }
    public RequisicaoCompraEntity select(Long id,Long quoteId,Long actor) {
        var r=find(id);state(r,"COTACAO");
        var q=em.find(CotacaoB2BEntity.class,quoteId);
        if(q==null || !tenant().equals(q.getEmpresaId()) || !id.equals(q.getRequisicaoCompraId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        r.setCotacaoSelecionadaId(quoteId);r.setStatus("APROVACAO");
        operations.audit("SELECIONAR_PROPOSTA","requisicao_compra",id,actor);return r;
    }
    public RequisicaoCompraEntity approve(Long id,String level,Long actor) {
        var r=find(id);state(r,"APROVACAO");var user=operations.member(actor);
        Set<String> roles=switch(level) {
            case "GESTAO" -> Set.of("SUPER_ADMIN","GERENTE_OBRA","INCORPORADOR");
            case "FINANCEIRO" -> Set.of("SUPER_ADMIN","FINANCEIRO");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Alçada inválida.");
        };
        if(!roles.contains(user.getPerfil())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(actor.equals(r.getAprovadorGestaoId()) || actor.equals(r.getAprovadorFinanceiroId()))
            throw conflict("As aprovações devem ser realizadas por duas pessoas distintas.");
        if("GESTAO".equals(level)) {
            if(r.getAprovadorGestaoId()!=null) throw conflict("Alçada de gestão já aprovada.");
            r.setAprovadorGestaoId(actor);
        } else {
            if(r.getAprovadorFinanceiroId()!=null) throw conflict("Alçada financeira já aprovada.");
            r.setAprovadorFinanceiroId(actor);
        }
        if(r.getAprovadorGestaoId()!=null && r.getAprovadorFinanceiroId()!=null) r.setStatus("APROVADO");
        operations.audit("APROVAR_COMPRA_"+level,"requisicao_compra",id,actor);return r;
    }
    public RequisicaoCompraEntity issue(Long id,Long actor) {
        var r=find(id);state(r,"APROVADO");r.setNumeroPedido("PC-"+r.getEmpresaId()+"-"+id);r.setStatus("PEDIDO");
        var quotes=em.createQuery("select c from CotacaoB2BEntity c where c.requisicaoCompraId=:id",CotacaoB2BEntity.class).setParameter("id",id).getResultList();
        for(var q:quotes) q.setStatusCotacao(q.getId().equals(r.getCotacaoSelecionadaId())?"APROVADO":"REJEITADO");
        operations.audit("EMITIR_PEDIDO","requisicao_compra",id,actor);return r;
    }
    public RequisicaoCompraEntity receive(Long id,Long actor) {
        var r=find(id);
        if("RECEBIDO".equals(r.getStatus())) return r;
        state(r,"PEDIDO");var item=operations.stock(r.getItemEstoqueId(),true);
        var q=em.find(CotacaoB2BEntity.class,r.getCotacaoSelecionadaId());
        BigDecimal newBalance=item.getQuantidadeAtual().add(r.getQuantidade());
        BigDecimal average=item.getQuantidadeAtual().multiply(item.getCustoUnitarioMedio()).add(q.getValorProposta())
            .divide(newBalance,2,RoundingMode.HALF_UP);
        if(average.compareTo(new BigDecimal("9999999999.99"))>0) throw conflict("Custo médio excede o limite do material.");
        var movement=operations.purchaseReceipt(item.getId(),r.getQuantidade(),q.getValorProposta(),UUID.randomUUID().toString(),actor);
        item.setCustoUnitarioMedio(average);
        r.setMovimentacaoId(movement.getId());r.setStatus("RECEBIDO");r.setDataRecebimento(OffsetDateTime.now());
        operations.audit("RECEBER_PEDIDO","requisicao_compra",id,actor);return r;
    }
    public RequisicaoCompraEntity cancel(Long id,Long actor) {
        var r=find(id);
        if(Set.of("RECEBIDO","CANCELADO").contains(r.getStatus())) throw conflict("Compra recebida ou cancelada não aceita cancelamento.");
        for(var q:em.createQuery("select c from CotacaoB2BEntity c where c.requisicaoCompraId=:id",CotacaoB2BEntity.class).setParameter("id",id).getResultList())
            q.setStatusCotacao("REJEITADO");
        r.setStatus("CANCELADO");operations.audit("CANCELAR_COMPRA","requisicao_compra",id,actor);return r;
    }
}
