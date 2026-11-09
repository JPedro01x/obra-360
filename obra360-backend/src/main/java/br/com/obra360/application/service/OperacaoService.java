package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class OperacaoService {
    private final EntityManager em;
    private Long tenant() { return Objects.requireNonNull(TenantContext.getCurrentTenant()); }
    public void audit(String action,String entity,Long id,Long actor) {
        em.persist(LogAuditoriaEntity.builder().empresaId(tenant()).usuarioId(actor).acao(action)
            .entidadeAfetada(entity).entidadeId(id).build());
    }
    private ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado nesta empresa."); }
    public ProjetoObraEntity project(Long id) {
        var p=em.find(ProjetoObraEntity.class,id);
        if(p==null || !tenant().equals(p.getEmpresaId())) throw missing();
        return p;
    }
    public UsuarioEntity member(Long id) {
        var u=em.find(UsuarioEntity.class,id);
        if(u==null || !tenant().equals(u.getEmpresaId()) || !Boolean.TRUE.equals(u.getAtivo())) throw missing();
        return u;
    }
    public EquipeTrabalhoEntity team(Long id) {
        var t=em.find(EquipeTrabalhoEntity.class,id);
        if(t==null) throw missing(); project(t.getProjetoObraId()); return t;
    }
    public ContratoServicoEntity contract(Long id) {
        var c=em.find(ContratoServicoEntity.class,id);
        if(c==null || !tenant().equals(c.getEmpresaId())) throw missing(); project(c.getProjetoObraId()); return c;
    }
    public SolicitacaoServicoEntity order(Long id,boolean lock) {
        var o=em.find(SolicitacaoServicoEntity.class,id,lock?LockModeType.PESSIMISTIC_WRITE:LockModeType.NONE);
        if(o==null) throw missing(); contract(o.getContratoServicoId()); return o;
    }
    public ItemEstoqueEntity stock(Long id,boolean lock) {
        var i=em.find(ItemEstoqueEntity.class,id,lock?LockModeType.PESSIMISTIC_WRITE:LockModeType.NONE);
        if(i==null || !tenant().equals(i.getEmpresaId())) throw missing(); project(i.getProjetoObraId()); return i;
    }
    public EquipeTrabalhoEntity createTeam(Long projectId,Long leader,String name,String specialty,int count,Long actor) {
        project(projectId); var u=member(leader);
        if(!Set.of("SUPER_ADMIN","ENGENHEIRO","GERENTE_OBRA","MESTRE_OBRA").contains(u.getPerfil())) throw invalid("O líder deve ter perfil de gestão ou execução de obra.");
        var t=EquipeTrabalhoEntity.builder().projetoObraId(projectId).liderEncarregadoId(leader).nomeEquipe(name.trim())
            .especialidade(specialty.trim()).quantidadeOperarios(count).build();
        em.persist(t);audit("CRIAR_EQUIPE","equipe_trabalho",t.getId(),actor); return t;
    }
    public ItemEstoqueEntity createStock(Long projectId,String sku,String name,String category,String unit,BigDecimal minimum,BigDecimal cost,Long actor) {
        project(projectId);
        var i=ItemEstoqueEntity.builder().empresaId(tenant()).projetoObraId(projectId).sku(sku.trim().toUpperCase(Locale.ROOT))
            .nome(name.trim()).categoria(category.trim()).unidadeMedida(unit.trim()).quantidadeAtual(BigDecimal.ZERO)
            .estoqueMinimo(minimum).custoUnitarioMedio(cost).build();
        em.persist(i);audit("CRIAR_MATERIAL","item_estoque",i.getId(),actor);return i;
    }
    public ContratoServicoEntity createContract(Long projectId,Long supplier,String number,BigDecimal value,BigDecimal retention,int sla,LocalDate start,LocalDate end,Long actor) {
        project(projectId);
        // Suppliers belong to the company's explicitly registered catalog.
        var f=em.find(FornecedorB2BEntity.class,supplier);
        if(f==null || !tenant().equals(f.getEmpresaId())) throw missing();
        if(end.isBefore(start)) throw invalid("Término anterior ao início.");
        var c=ContratoServicoEntity.builder().empresaId(tenant()).projetoObraId(projectId).fornecedorB2bId(supplier)
            .numeroContrato(number.trim()).valorTotal(value).retencaoTecnicaPct(retention).tempoLimiteSlaHoras(sla).dataInicio(start).dataTermino(end).build();
        em.persist(c);audit("CRIAR_CONTRATO","contrato_servico",c.getId(),actor);return c;
    }
    public FornecedorB2BEntity createSupplier(String cnpj,String name,String category,Long actor) {
        var f=FornecedorB2BEntity.builder().empresaId(tenant()).cnpj(cnpj.toUpperCase(Locale.ROOT)).razaoSocial(name.trim())
            .categoriaFornecimento(category).statusHomologacao("EM_ANALISE").scoreReputacao(BigDecimal.ZERO).build();
        em.persist(f);audit("CRIAR_FORNECEDOR","fornecedor_b2b",f.getId(),actor);return f;
    }
    public SolicitacaoServicoEntity createOrder(Long contractId,Long teamId,String description,String priority,OffsetDateTime deadline,Long actor) {
        var c=contract(contractId);var t=team(teamId);
        if(!t.getProjetoObraId().equals(c.getProjetoObraId())) throw invalid("Equipe e contrato devem pertencer à mesma obra.");
        if(!Set.of("BAIXA","MEDIA","ALTA","URGENTE").contains(priority)) throw invalid("Prioridade inválida.");
        var o=SolicitacaoServicoEntity.builder().contratoServicoId(contractId).equipeTrabalhoId(teamId).descricao(description.trim())
            .codigoProtocolo("OS-"+UUID.randomUUID().toString().replace("-","").substring(0,24).toUpperCase(Locale.ROOT))
            .prioridade(priority).statusOs("ABERTO").dataLimiteSla(deadline).build();
        em.persist(o);audit("CRIAR_ORDEM","solicitacao_servico",o.getId(),actor);return o;
    }
    public SolicitacaoServicoEntity changeOrder(Long id,String status,Long actor) {
        var o=order(id,true);String old=o.getStatusOs();
        if(old.equals(status)) return o;
        boolean allowed=(old.equals("ABERTO") && Set.of("EM_ANDAMENTO","CANCELADO").contains(status)) ||
            (old.equals("EM_ANDAMENTO") && Set.of("CONCLUIDO","CANCELADO").contains(status));
        if(!allowed) throw new ResponseStatusException(HttpStatus.CONFLICT,"Transição de situação não permitida.");
        o.setStatusOs(status);
        if(Set.of("CONCLUIDO","CANCELADO").contains(status)) o.setDataEncerramento(OffsetDateTime.now());
        audit("ORDEM_"+status,"solicitacao_servico",id,actor);return o;
    }
    public MovimentacaoEstoqueEntity movement(Long stockId,String type,BigDecimal quantity,Long orderId,String key,Long actor) {
        if(quantity==null || quantity.signum()<=0) throw invalid("A quantidade deve ser positiva.");
        UUID.fromString(key);
        SolicitacaoServicoEntity order=orderId==null?null:order(orderId,true);
        var item=stock(stockId,true);
        var previous=em.createQuery("select m from MovimentacaoEstoqueEntity m where m.chaveOperacao=:key",MovimentacaoEstoqueEntity.class).setParameter("key",key).getResultList();
        if(!previous.isEmpty()) {
            var p=previous.get(0);
            if(!p.getItemEstoqueId().equals(stockId) || !p.getUsuarioId().equals(actor) || p.getQuantidade().compareTo(quantity)!=0 ||
                !p.getTipoMovimentacao().equals(type) || !Objects.equals(p.getOrdemServicoId(),orderId)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Identificador de operação já utilizado.");
            return p;
        }
        if(!Set.of("ENTRADA","SAIDA","CONSUMO_OS").contains(type)) throw invalid("Tipo de movimentação inválido.");
        if(type.equals("CONSUMO_OS") != (order!=null)) throw invalid("Consumo de material exige uma ordem de serviço.");
        if(order!=null) {
            if(!Set.of("ABERTO","EM_ANDAMENTO").contains(order.getStatusOs())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Ordem encerrada não aceita consumo.");
            if(!contract(order.getContratoServicoId()).getProjetoObraId().equals(item.getProjetoObraId())) throw invalid("Material e ordem devem pertencer à mesma obra.");
            if(quantity.stripTrailingZeros().scale()>3) throw invalid("O consumo permite até três casas decimais.");
        }
        BigDecimal balance=type.equals("ENTRADA")?item.getQuantidadeAtual().add(quantity):item.getQuantidadeAtual().subtract(quantity);
        if(balance.signum()<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Saldo insuficiente para esta saída.");
        if(balance.compareTo(new BigDecimal("99999999.9999"))>0) throw invalid("Saldo excede o limite do cadastro.");
        BigDecimal value=quantity.multiply(item.getCustoUnitarioMedio()).setScale(2,RoundingMode.HALF_UP);
        if(value.compareTo(new BigDecimal(order==null?"999999999999.99":"9999999999.99"))>0) throw invalid("Valor da movimentação excede o limite.");
        item.setQuantidadeAtual(balance);
        var movement=MovimentacaoEstoqueEntity.builder().itemEstoqueId(stockId).usuarioId(actor).tipoMovimentacao(type)
            .quantidade(quantity).valorTotal(value).ordemServicoId(orderId).chaveOperacao(key).build();em.persist(movement);
        if(order!=null) em.persist(ConsumoOrdemEntity.builder().ordemServicoId(orderId).itemEstoqueId(stockId)
            .quantidadeUtilizada(quantity).custoTotalInsumo(value).build());
        audit("MOVIMENTAR_"+type,"movimentacao_estoque",movement.getId(),actor);return movement;
    }
}
