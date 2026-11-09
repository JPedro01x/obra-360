package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.application.service.ModeloDocumentoService;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;

@RestController @RequiredArgsConstructor @Transactional(readOnly=true)
public class ExternalPortalController {
    private final EntityManager em;private final OperacaoService operation;
    private final ModeloDocumentoService modelDocuments;
    private static final Set<String> ROLES=Set.of("CLIENTE","CORRETOR","INVESTIDOR","FORNECEDOR","LOCADOR_MAQUINAS");
    @PostMapping("/api/v1/workspace/acessos") @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')") @ResponseStatus(HttpStatus.CREATED)
    public AcessoExternoEntity grant(@Valid @RequestBody Grant r,Authentication auth){
        var user=operation.member(r.usuarioId());operation.project(r.projetoObraId());if(!ROLES.contains(user.getPerfil()))throw bad("Selecione um usuário com perfil externo.");
        if("CLIENTE".equals(user.getPerfil())&&r.unidadeImobiliariaId()==null)throw bad("Vincule a unidade do cliente.");
        if(Set.of("FORNECEDOR","LOCADOR_MAQUINAS").contains(user.getPerfil())&&r.fornecedorB2bId()==null)throw bad("Vincule o fornecedor da conta.");
        if(r.unidadeImobiliariaId()!=null){var unit=em.find(UnidadeImobiliariaEntity.class,r.unidadeImobiliariaId());if(unit==null||!r.projetoObraId().equals(unit.getProjetoObraId()))throw bad("Unidade deve pertencer à obra selecionada.");}
        if(r.fornecedorB2bId()!=null){var supplier=em.find(FornecedorB2BEntity.class,r.fornecedorB2bId());if(supplier==null||!user.getEmpresaId().equals(supplier.getEmpresaId()))throw bad("Fornecedor não encontrado nesta empresa.");}
        var existing=em.createQuery("select a from AcessoExternoEntity a where a.usuarioId=:u and a.projetoObraId=:p and a.perfil=:role",AcessoExternoEntity.class).setParameter("u",user.getId()).setParameter("p",r.projetoObraId()).setParameter("role",user.getPerfil()).getResultList();
        for(var access:existing)if(Objects.equals(access.getUnidadeImobiliariaId(),r.unidadeImobiliariaId())&&Objects.equals(access.getFornecedorB2bId(),r.fornecedorB2bId()))return access;
        var access=AcessoExternoEntity.builder().empresaId(user.getEmpresaId()).usuarioId(user.getId()).perfil(user.getPerfil()).projetoObraId(r.projetoObraId()).unidadeImobiliariaId(r.unidadeImobiliariaId()).fornecedorB2bId(r.fornecedorB2bId()).build();em.persist(access);operation.audit("CONCEDER_ACESSO","acesso_externo",access.getId(),Long.valueOf(auth.getName()));return access;
    }
    @DeleteMapping("/api/v1/workspace/acessos/{id}") @Transactional @PreAuthorize("hasRole('SUPER_ADMIN')") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id,Authentication auth){var access=em.find(AcessoExternoEntity.class,id);if(access==null||!TenantContext.getCurrentTenant().equals(access.getEmpresaId()))throw missing();em.remove(access);operation.audit("REVOGAR_ACESSO","acesso_externo",id,Long.valueOf(auth.getName()));}
    private UsuarioEntity user(Authentication a){var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()));if(!ROLES.contains(user.getPerfil()))throw new ResponseStatusException(HttpStatus.FORBIDDEN);return user;}
    private List<AcessoExternoEntity> accesses(UsuarioEntity user){return em.createQuery("select a from AcessoExternoEntity a where a.usuarioId=:u and a.empresaId=:t and a.perfil=:r",AcessoExternoEntity.class).setParameter("u",user.getId()).setParameter("t",user.getEmpresaId()).setParameter("r",user.getPerfil()).getResultList();}
    private UnidadeImobiliariaEntity clientUnit(Long unitId, UsuarioEntity client) {
        var unit = em.find(UnidadeImobiliariaEntity.class, unitId);
        if (unit==null || accesses(client).stream().noneMatch(access ->
            unitId.equals(access.getUnidadeImobiliariaId()) &&
            unit.getProjetoObraId().equals(access.getProjetoObraId()))) throw missing();
        operation.project(unit.getProjetoObraId());
        return unit;
    }

    private static final String PUBLISHED_PLANS = """
        from ModeloObraEntity m join ModeloRevisaoEntity r
        on r.modeloId=m.id and r.empresaId=m.empresaId and r.numero=coalesce(m.revisaoPublicada,m.revisao)
        where m.empresaId=:empresa and m.projetoObraId=:obra and m.unidadePublicadaId=:unidade
        and m.arquivado=false
        """;

    @GetMapping("/api/v1/portal/unidades/{unitId}/plantas")
    @PreAuthorize("hasRole('CLIENTE')")
    public List<Map<String,Object>> clientPlans(@PathVariable Long unitId, Authentication auth) {
        var client = user(auth);
        var unit = clientUnit(unitId,client);
        return em.createQuery("select m.id, r.nome, r.numero " + PUBLISHED_PLANS + " order by r.nome, m.id", Object[].class)
            .setParameter("empresa",client.getEmpresaId()).setParameter("obra",unit.getProjetoObraId())
            .setParameter("unidade",unitId).getResultList().stream()
            .map(row -> Map.<String,Object>of("id",row[0],"nome",row[1],"revisao",row[2])).toList();
    }

    @GetMapping("/api/v1/portal/unidades/{unitId}/plantas/{modelId}")
    @PreAuthorize("hasRole('CLIENTE')")
    public Map<String,Object> clientPlan(@PathVariable Long unitId, @PathVariable Long modelId, Authentication auth) {
        var client = user(auth);
        var unit = clientUnit(unitId,client);
        var revision = em.createQuery("select r " + PUBLISHED_PLANS + " and m.id=:modelo", ModeloRevisaoEntity.class)
            .setParameter("empresa",client.getEmpresaId()).setParameter("obra",unit.getProjetoObraId())
            .setParameter("unidade",unitId).setParameter("modelo",modelId).getResultList()
            .stream().findFirst().orElseThrow(this::missing);
        return Map.of("id",modelId,"nome",revision.getNome(),"revisao",revision.getNumero(),
            "documento",modelDocuments.decode(revision.getDocumento()));
    }
    @GetMapping("/api/v1/portal") public Map<String,Object> snapshot(Authentication a){
        var user=user(a);var accesses=accesses(user);List<Map<String,Object>> projects=new ArrayList<>(),units=new ArrayList<>(),contracts=new ArrayList<>(),quotes=new ArrayList<>();List<GarantiaPosVendaEntity> tickets=new ArrayList<>();Set<Long> seenProjects=new HashSet<>(),seenUnits=new HashSet<>(),seenContracts=new HashSet<>(),seenQuotes=new HashSet<>();
        for(var access:accesses){
            var project=operation.project(access.getProjetoObraId());if(seenProjects.add(project.getId())){var average=em.createQuery("select avg(e.percentualExecutado) from EtapaCronogramaEntity e where e.projetoObraId=:p",Double.class).setParameter("p",project.getId()).getSingleResult();Map<String,Object> view=new LinkedHashMap<>();view.put("id",project.getId());view.put("nome",project.getNome());view.put("entrega",project.getDataPrevisaoFim());view.put("progresso",average);projects.add(view);}
            List<UnidadeImobiliariaEntity> allowedUnits=new ArrayList<>();
            if("CLIENTE".equals(user.getPerfil())&&access.getUnidadeImobiliariaId()!=null){var unit=em.find(UnidadeImobiliariaEntity.class,access.getUnidadeImobiliariaId());if(unit!=null&&project.getId().equals(unit.getProjetoObraId()))allowedUnits.add(unit);}
            else if("CORRETOR".equals(user.getPerfil()))allowedUnits=em.createQuery("select u from UnidadeImobiliariaEntity u where u.projetoObraId=:p",UnidadeImobiliariaEntity.class).setParameter("p",project.getId()).getResultList();
            for(var unit:allowedUnits)if(seenUnits.add(unit.getId())){units.add(Map.of("id",unit.getId(),"projetoObraId",project.getId(),"codigo",unit.getCodigoUnidade(),"situacao",unit.getStatusVenda(),"area",unit.getAreaPrivativaM2(),"valorTabela",unit.getValorTabela(),"reservadaPorVoce",user.getId().equals(unit.getReservaUsuarioId())));if("CLIENTE".equals(user.getPerfil()))tickets.addAll(em.createQuery("select g from GarantiaPosVendaEntity g where g.unidadeImobiliariaId=:u and g.usuarioClienteId=:c order by g.id desc",GarantiaPosVendaEntity.class).setParameter("u",unit.getId()).setParameter("c",user.getId()).getResultList());}
            if(Set.of("FORNECEDOR","LOCADOR_MAQUINAS").contains(user.getPerfil())&&access.getFornecedorB2bId()!=null){
                for(var contract:em.createQuery("select c from ContratoServicoEntity c where c.empresaId=:t and c.projetoObraId=:p and c.fornecedorB2bId=:f",ContratoServicoEntity.class).setParameter("t",user.getEmpresaId()).setParameter("p",project.getId()).setParameter("f",access.getFornecedorB2bId()).getResultList())if(seenContracts.add(contract.getId()))contracts.add(Map.of("numero",contract.getNumeroContrato(),"valor",contract.getValorTotal(),"termino",contract.getDataTermino()));
                for(var quote:em.createQuery("select c from CotacaoB2BEntity c where c.empresaId=:t and c.fornecedorB2bId=:f",CotacaoB2BEntity.class).setParameter("t",user.getEmpresaId()).setParameter("f",access.getFornecedorB2bId()).getResultList())if(seenQuotes.add(quote.getId()))quotes.add(Map.of("codigo",quote.getCodigoCotacao(),"valor",quote.getValorProposta(),"prazo",quote.getPrazoEntregaDias(),"situacao",quote.getStatusCotacao()));
            }
        }
        return Map.of("perfil",user.getPerfil(),"acessos",accesses,"projetos",projects,"unidades",units,"contratos",contracts,"cotacoes",quotes,"chamados",tickets);
    }
    @PostMapping("/api/v1/portal/chamados") @Transactional @PreAuthorize("hasRole('CLIENTE')") @ResponseStatus(HttpStatus.CREATED)
    public GarantiaPosVendaEntity ticket(@Valid @RequestBody Ticket r,Authentication a){var user=user(a);if(accesses(user).stream().noneMatch(access->r.unidadeId().equals(access.getUnidadeImobiliariaId())))throw missing();var ticket=GarantiaPosVendaEntity.builder().unidadeImobiliariaId(r.unidadeId()).usuarioClienteId(user.getId()).codigoChamado("AT-"+UUID.randomUUID().toString().replace("-","").substring(0,24)).descricaoDefeito(r.descricao()).categoriaDefeito(r.categoria()).statusChamado("ABERTO").build();em.persist(ticket);operation.audit("ABRIR_CHAMADO_PORTAL","garantia_pos_venda",ticket.getId(),user.getId());return ticket;}
    @PostMapping("/api/v1/portal/unidades/{id}/reservar") @Transactional @PreAuthorize("hasRole('CORRETOR')")
    public void reserve(@PathVariable Long id,Authentication a){var user=user(a);var unit=em.find(UnidadeImobiliariaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);if(unit==null||accesses(user).stream().noneMatch(access->unit.getProjetoObraId().equals(access.getProjetoObraId())))throw missing();if(!"DISPONIVEL".equals(unit.getStatusVenda()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Unidade não está mais disponível.");unit.setStatusVenda("RESERVADO");unit.setReservaUsuarioId(user.getId());operation.audit("RESERVAR_UNIDADE","unidade_imobiliaria",id,user.getId());}
    @PostMapping("/api/v1/portal/propostas") @Transactional @PreAuthorize("hasAnyRole('FORNECEDOR','LOCADOR_MAQUINAS')") @ResponseStatus(HttpStatus.CREATED)
    public CotacaoB2BEntity proposal(@Valid @RequestBody Proposal r,Authentication a){var user=user(a);var access=accesses(user).stream().filter(b->b.getId().equals(r.acessoId())).findFirst().orElseThrow(this::missing);if(access.getFornecedorB2bId()==null)throw missing();var quote=CotacaoB2BEntity.builder().empresaId(user.getEmpresaId()).fornecedorB2bId(access.getFornecedorB2bId()).codigoCotacao("PRO-"+UUID.randomUUID().toString().replace("-","").substring(0,24)).valorProposta(r.valor()).prazoEntregaDias(r.prazoDias()).statusCotacao("EM_ANALISE").build();em.persist(quote);operation.audit("ENVIAR_PROPOSTA","cotacao_b2b",quote.getId(),user.getId());return quote;}
    private ResponseStatusException missing(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não vinculado à sua conta.");}
    private ResponseStatusException bad(String reason){return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    public record Grant(@NotNull @Positive Long usuarioId,@NotNull @Positive Long projetoObraId,@Positive Long unidadeImobiliariaId,@Positive Long fornecedorB2bId){}
    public record Ticket(@NotNull @Positive Long unidadeId,@NotBlank @Size(max=10000) String descricao,@NotBlank @Size(max=50) String categoria){}
    public record Proposal(@NotNull @Positive Long acessoId,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valor,@Min(0) @Max(3650) int prazoDias){}
}
