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
    private final PlanningDates dates;
    private Long tenant() { return Objects.requireNonNull(TenantContext.getCurrentTenant()); }
    public void audit(String action,String entity,Long id,Long actor) {
        em.persist(LogAuditoriaEntity.builder().empresaId(tenant()).usuarioId(actor).acao(action)
            .entidadeAfetada(entity).entidadeId(id).build());
    }
    private ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado nesta empresa."); }
    private LockModeType referenceLock() {
        return org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive() &&
            !org.springframework.transaction.support.TransactionSynchronizationManager.isCurrentTransactionReadOnly()
            ? LockModeType.PESSIMISTIC_WRITE : LockModeType.NONE;
    }
    public ProjetoObraEntity project(Long id) {
        var p=em.createQuery("select p from ProjetoObraEntity p where p.id=:id and p.empresaId=:tenant",ProjetoObraEntity.class).setParameter("id",id).setParameter("tenant",tenant()).setLockMode(referenceLock()).getResultList().stream().findFirst().orElse(null);
        if(p==null || !tenant().equals(p.getEmpresaId())) throw missing();
        return p;
    }
    public UsuarioEntity member(Long id) {
        var u=em.find(UsuarioEntity.class,id);
        if(u==null || !tenant().equals(u.getEmpresaId()) || !Boolean.TRUE.equals(u.getAtivo())) throw missing();
        return u;
    }
    public EquipeTrabalhoEntity team(Long id) {
        var projects=em.createQuery("select t.projetoObraId from EquipeTrabalhoEntity t where t.id=:id",Long.class).setParameter("id",id).getResultList();
        if(projects.isEmpty())throw missing();project(projects.get(0));
        var t=em.find(EquipeTrabalhoEntity.class,id,referenceLock());if(t==null)throw missing();return t;
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
        var f=em.find(FornecedorB2BEntity.class,supplier,referenceLock());
        if(f==null || !tenant().equals(f.getEmpresaId())) throw missing();
        dates.newPeriod(start,end);
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
        return createOrder(contractId,teamId,description,priority,deadline,false,actor);
    }
    public SolicitacaoServicoEntity createOrder(Long contractId,Long teamId,String description,String priority,OffsetDateTime deadline,boolean requiresMaterial,Long actor) {
        var c=contract(contractId);var t=team(teamId);
        LocalDate today=LocalDate.now();
        if(!c.isAtivo() || today.isBefore(c.getDataInicio()) || today.isAfter(c.getDataTermino()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"O contrato deve estar ativo e dentro da vigência para abrir uma OS.");
        if(!t.getProjetoObraId().equals(c.getProjetoObraId())) throw invalid("Equipe e contrato devem pertencer à mesma obra.");
        if(!Set.of("BAIXA","MEDIA","ALTA","URGENTE").contains(priority)) throw invalid("Prioridade inválida.");
        OffsetDateTime now=OffsetDateTime.now();
        if(deadline==null) {
            long hours=c.getTempoLimiteSlaHoras();
            hours=switch(priority) {case "BAIXA" -> hours*2;case "ALTA" -> Math.max(1,hours/2);case "URGENTE" -> Math.max(1,hours/4);default -> hours;};
            deadline=now.plusHours(hours);
        }
        if(!deadline.isAfter(now)) throw invalid("O prazo deve ser futuro.");
        var o=SolicitacaoServicoEntity.builder().contratoServicoId(contractId).equipeTrabalhoId(teamId).descricao(description.trim())
            .codigoProtocolo("OS-"+UUID.randomUUID().toString().replace("-","").substring(0,24).toUpperCase(Locale.ROOT))
            .prioridade(priority).statusOs("ABERTO").dataAbertura(now).dataLimiteSla(deadline).exigeMaterial(requiresMaterial).build();
        em.persist(o);audit("CRIAR_ORDEM","solicitacao_servico",o.getId(),actor);return o;
    }
    public SolicitacaoServicoEntity changeOrder(Long id,String status,Long actor) {
        var o=order(id,true);String old=o.getStatusOs();
        if(old.equals(status)) return o;
        boolean allowed=(old.equals("ABERTO") && Set.of("EM_ANDAMENTO","CANCELADO").contains(status)) ||
            (old.equals("EM_ANDAMENTO") && Set.of("CONCLUIDO","CANCELADO").contains(status));
        if(!allowed) throw new ResponseStatusException(HttpStatus.CONFLICT,"Transição de situação não permitida.");
        if(status.equals("CONCLUIDO")) {
            validateMaterials(o);
            if(o.getDataLimiteSla().isBefore(OffsetDateTime.now()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"OS atrasada exige justificativa e aprovação de outro engenheiro ou administrador.");
        }
        o.setStatusOs(status);
        if(Set.of("CONCLUIDO","CANCELADO").contains(status)) o.setDataEncerramento(OffsetDateTime.now());
        audit("ORDEM_"+status,"solicitacao_servico",id,actor);return o;
    }
    private void validateMaterials(SolicitacaoServicoEntity order) {
        if(order.isExigeMaterial() && em.createQuery("select count(c) from ConsumoOrdemEntity c where c.ordemServicoId=:id",Long.class)
            .setParameter("id",order.getId()).getSingleResult()==0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Registre o consumo de material antes de concluir esta OS.");
    }
    public SolicitacaoServicoEntity requestLateClosure(Long id,String reason,Long actor) {
        var o=order(id,true);
        if(!"EM_ANDAMENTO".equals(o.getStatusOs()) || !o.getDataLimiteSla().isBefore(OffsetDateTime.now()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"A justificativa é exclusiva para OS em andamento e atrasada.");
        if(reason==null || reason.trim().length()<10 || reason.trim().length()>2000) throw invalid("Informe justificativa entre 10 e 2000 caracteres.");
        o.setJustificativaAtraso(reason.trim());o.setSolicitanteEncerramentoId(actor);o.setAprovadorEncerramentoId(null);
        audit("SOLICITAR_ENCERRAMENTO","solicitacao_servico",id,actor);return o;
    }
    public SolicitacaoServicoEntity approveLateClosure(Long id,Long actor) {
        var approver=member(actor);
        if(!Set.of("ENGENHEIRO","GERENTE_OBRA","SUPER_ADMIN").contains(approver.getPerfil()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Aprovação restrita a engenheiro ou administrador.");
        var o=order(id,true);
        var work=project(contract(o.getContratoServicoId()).getProjetoObraId());
        if(!"SUPER_ADMIN".equals(approver.getPerfil()) && !actor.equals(work.getEngenheiroResponsavelId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Somente o responsável pela obra ou administrador pode aprovar.");
        if(!"EM_ANDAMENTO".equals(o.getStatusOs()) || o.getSolicitanteEncerramentoId()==null || o.getJustificativaAtraso()==null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Não há solicitação de encerramento pendente.");
        if(actor.equals(o.getSolicitanteEncerramentoId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Outra pessoa deve aprovar o encerramento.");
        validateMaterials(o);o.setAprovadorEncerramentoId(actor);o.setStatusOs("CONCLUIDO");o.setDataEncerramento(OffsetDateTime.now());
        audit("APROVAR_ENCERRAMENTO","solicitacao_servico",id,actor);return o;
    }
    public ContratoServicoEntity contractState(Long id,boolean active,Long actor) {
        var c=em.find(ContratoServicoEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(c==null || !tenant().equals(c.getEmpresaId())) throw missing();
        c.setAtivo(active);audit(active?"ATIVAR_CONTRATO":"INATIVAR_CONTRATO","contrato_servico",id,actor);return c;
    }
    public MovimentacaoEstoqueEntity movement(Long stockId,String type,BigDecimal quantity,Long orderId,String key,Long actor) {
        return movement(stockId,type,quantity,orderId,key,actor,null);
    }
    public MovimentacaoEstoqueEntity purchaseReceipt(Long stockId,BigDecimal quantity,BigDecimal total,String key,Long actor) {
        if(total==null || total.signum()<=0 || total.stripTrailingZeros().scale()>2) throw invalid("Valor de recebimento inválido.");
        return movement(stockId,"ENTRADA",quantity,null,key,actor,total);
    }
    private MovimentacaoEstoqueEntity movement(Long stockId,String type,BigDecimal quantity,Long orderId,String key,Long actor,BigDecimal receivedTotal) {
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
        BigDecimal value=receivedTotal!=null?receivedTotal:quantity.multiply(item.getCustoUnitarioMedio()).setScale(2,RoundingMode.HALF_UP);
        if(value.compareTo(new BigDecimal(order==null?"999999999999.99":"9999999999.99"))>0) throw invalid("Valor da movimentação excede o limite.");
        item.setQuantidadeAtual(balance);
        var movement=MovimentacaoEstoqueEntity.builder().itemEstoqueId(stockId).usuarioId(actor).tipoMovimentacao(type)
            .quantidade(quantity).valorTotal(value).ordemServicoId(orderId).chaveOperacao(key).build();em.persist(movement);
        if(order!=null) em.persist(ConsumoOrdemEntity.builder().ordemServicoId(orderId).itemEstoqueId(stockId)
            .quantidadeUtilizada(quantity).custoTotalInsumo(value).build());
        audit("MOVIMENTAR_"+type,"movimentacao_estoque",movement.getId(),actor);return movement;
    }
}
