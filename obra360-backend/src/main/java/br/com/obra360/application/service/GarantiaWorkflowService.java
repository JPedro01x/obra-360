package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@Service @Transactional
public class GarantiaWorkflowService {
    private final EntityManager em;
    private final OperacaoService operations;
    private final NotificacaoService notifications;
    private final PlanningDates dates;
    public GarantiaWorkflowService(EntityManager em,OperacaoService operations,NotificacaoService notifications,PlanningDates dates) {
        this.em=em;this.operations=operations;this.notifications=notifications;this.dates=dates;
    }
    private ResponseStatusException missing() {return new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado nesta empresa.");}
    private ResponseStatusException conflict(String message) {return new ResponseStatusException(HttpStatus.CONFLICT,message);}
    private UnidadeImobiliariaEntity unit(Long id) {
        var unit=em.find(UnidadeImobiliariaEntity.class,id);if(unit==null) throw missing();operations.project(unit.getProjetoObraId());return unit;
    }
    private GarantiaPosVendaEntity ticket(Long id) {
        var ticket=em.find(GarantiaPosVendaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(ticket==null) throw missing();unit(ticket.getUnidadeImobiliariaId());return ticket;
    }
    private void open(GarantiaPosVendaEntity ticket) {if("CONCLUIDO".equals(ticket.getStatusChamado())) throw conflict("Chamado concluído não aceita esta operação.");}
    public CoberturaGarantiaEntity coverage(Long unitId,String category,LocalDate start,LocalDate end,String description,boolean active,Long actor) {
        unit(unitId);em.find(UnidadeImobiliariaEntity.class,unitId,LockModeType.PESSIMISTIC_WRITE);
        dates.newPeriod(start,end);
        category=category.trim().toUpperCase(Locale.ROOT);
        var found=em.createQuery("select c from CoberturaGarantiaEntity c where c.unidadeId=:unit and c.categoria=:category",CoberturaGarantiaEntity.class)
            .setParameter("unit",unitId).setParameter("category",category).getResultList();
        if(!found.isEmpty()) throw conflict("Já existe cobertura para esta categoria na unidade.");
        var c=new CoberturaGarantiaEntity();c.setEmpresaId(TenantContext.getCurrentTenant());c.setUnidadeId(unitId);c.setCategoria(category);
        c.setDataInicio(start);c.setDataFim(end);c.setDescricao(description.trim());c.setAtivo(active);em.persist(c);
        operations.audit("CADASTRAR_COBERTURA","cobertura_garantia",c.getId(),actor);return c;
    }
    public GarantiaPosVendaEntity create(Long unitId,Long clientId,String description,String category,Long actor) {
        var unit=unit(unitId);var client=operations.member(clientId);
        long links=em.createQuery("select count(a) from AcessoExternoEntity a where a.empresaId=:t and a.usuarioId=:client and a.perfil='CLIENTE' and a.unidadeImobiliariaId=:unit and a.projetoObraId=:project",Long.class)
            .setParameter("t",TenantContext.getCurrentTenant()).setParameter("client",clientId).setParameter("unit",unitId).setParameter("project",unit.getProjetoObraId()).getSingleResult();
        if(!"CLIENTE".equals(client.getPerfil()) || links==0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"O titular deve ser um cliente vinculado à unidade.");
        category=category.trim().toUpperCase(Locale.ROOT);
        var ticket=GarantiaPosVendaEntity.builder().unidadeImobiliariaId(unitId).usuarioClienteId(clientId).descricaoDefeito(description.trim())
            .categoriaDefeito(category).codigoChamado("AT-"+UUID.randomUUID().toString().replace("-","").substring(0,24))
            .statusChamado("ABERTO").dataAbertura(OffsetDateTime.now()).build();
        var policies=em.createQuery("select c from CoberturaGarantiaEntity c where c.empresaId=:t and c.unidadeId=:unit and c.categoria=:category and c.ativo=true",CoberturaGarantiaEntity.class)
            .setParameter("t",TenantContext.getCurrentTenant()).setParameter("unit",unitId).setParameter("category",category).getResultList();
        ticket.setSituacaoCobertura("NAO_CONFIGURADA");
        if(!policies.isEmpty()) {
            var policy=policies.get(0);LocalDate opened=ticket.getDataAbertura().toLocalDate();ticket.setCoberturaId(policy.getId());
            ticket.setSituacaoCobertura(!opened.isBefore(policy.getDataInicio()) && !opened.isAfter(policy.getDataFim())?"DENTRO_PRAZO":"FORA_PRAZO");
        }
        em.persist(ticket);operations.audit("ABRIR_GARANTIA","garantia_pos_venda",ticket.getId(),actor);
        notifications.send(operations.project(unit.getProjetoObraId()).getEngenheiroResponsavelId(),"Novo chamado de garantia "+ticket.getCodigoChamado()+" para a unidade "+unit.getCodigoUnidade()+".");
        return ticket;
    }
    public GarantiaPosVendaEntity assess(Long id,String decision,String reason,Long actor) {
        var ticket=ticket(id);open(ticket);
        if(ticket.getOrdemServicoId()!=null) throw conflict("A avaliação não pode mudar após a geração da OS.");
        ticket.setSituacaoCobertura(decision);ticket.setMotivoAvaliacao(reason.trim());ticket.setAvaliadorId(actor);
        operations.audit("AVALIAR_GARANTIA_"+decision,"garantia_pos_venda",id,actor);
        notifications.send(ticket.getUsuarioClienteId(),"A cobertura do chamado "+ticket.getCodigoChamado()+" foi avaliada: "+decision.replace('_',' ')+".");return ticket;
    }
    public GarantiaPosVendaEntity schedule(Long id,Long responsible,OffsetDateTime date,Long actor) {
        var ticket=ticket(id);open(ticket);var user=operations.member(responsible);
        if(!Set.of("ENGENHEIRO","GERENTE_OBRA","SUPER_ADMIN").contains(user.getPerfil())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selecione responsável técnico ou gestor.");
        if(!date.isAfter(OffsetDateTime.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A vistoria deve ser futura.");
        ticket.setVistoriaEm(date);ticket.setResponsavelVistoriaId(responsible);ticket.setStatusChamado("EM_ATENDIMENTO");
        operations.audit("AGENDAR_VISTORIA","garantia_pos_venda",id,actor);
        notifications.send(responsible,"Vistoria agendada para o chamado "+ticket.getCodigoChamado()+" em "+date+".");
        notifications.send(ticket.getUsuarioClienteId(),"Vistoria agendada para o chamado "+ticket.getCodigoChamado()+" em "+date+".");return ticket;
    }
    public GarantiaPosVendaEntity convert(Long id,Long contract,Long team,String priority,boolean material,Long actor) {
        var ticket=ticket(id);
        if(ticket.getOrdemServicoId()!=null) return ticket;
        open(ticket);
        if(!"COBERTA".equals(ticket.getSituacaoCobertura())) throw conflict("Avalie e aprove a cobertura antes de gerar a OS.");
        var unit=unit(ticket.getUnidadeImobiliariaId());
        if(!unit.getProjetoObraId().equals(operations.contract(contract).getProjetoObraId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Contrato e unidade devem pertencer à mesma obra.");
        var order=operations.createOrder(contract,team,ticket.getDescricaoDefeito(),priority,null,material,actor);order.setUnidadeImobiliariaId(unit.getId());
        ticket.setOrdemServicoId(order.getId());ticket.setStatusChamado("EM_ATENDIMENTO");
        operations.audit("GARANTIA_GERAR_OS","garantia_pos_venda",id,actor);return ticket;
    }
    public GarantiaPosVendaEntity state(Long id,String status,Long actor) {
        var ticket=ticket(id);if(status.equals(ticket.getStatusChamado())) return ticket;open(ticket);
        if("ABERTO".equals(status)) throw conflict("Não é permitido retornar o chamado à abertura.");
        if("CONCLUIDO".equals(status)) {
            if(ticket.getOrdemServicoId()!=null && !"CONCLUIDO".equals(operations.order(ticket.getOrdemServicoId(),true).getStatusOs()))
                throw conflict("Conclua a OS vinculada antes de encerrar o chamado.");
            if(ticket.getOrdemServicoId()==null && !"NAO_COBERTA".equals(ticket.getSituacaoCobertura()))
                throw conflict("Registre a avaliação negativa ou conclua uma OS vinculada antes de encerrar.");
            ticket.setDataAtendimento(OffsetDateTime.now());
        }
        ticket.setStatusChamado(status);operations.audit("GARANTIA_"+status,"garantia_pos_venda",id,actor);
        notifications.send(ticket.getUsuarioClienteId(),"O chamado "+ticket.getCodigoChamado()+" foi atualizado para "+status+".");return ticket;
    }
}
