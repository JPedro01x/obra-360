package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import br.com.obra360.application.service.RhHistoricoService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/projetos") @RequiredArgsConstructor
@Transactional(readOnly=true)
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','MESTRE_OBRA','ALMOXARIFE','INCORPORADOR')")
public class ProjetoConfiguracaoController {
    private static final Set<String> WAIVABLE_STEPS=Set.of("materiais","planta2d","cliente");
    private final EntityManager em;
    private final RhHistoricoService rhHistory;
    private final ObjectMapper mapper;

    private Long tenant(){return TenantContext.getCurrentTenant();}
    private ProjetoObraEntity project(Long id){
        var rows=em.createQuery("select p from ProjetoObraEntity p where p.id=:id and p.empresaId=:tenant",ProjetoObraEntity.class)
            .setParameter("id",id).setParameter("tenant",tenant()).getResultList();
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Obra não encontrada nesta empresa.");
        return rows.get(0);
    }
    private long count(String jpql,Long id){return em.createQuery(jpql,Long.class).setParameter("tenant",tenant()).setParameter("project",id).getSingleResult();}

    @GetMapping("/{id}/configuracao")
    public Map<String,Object> summary(@PathVariable Long id){
        var project=project(id);
        long staff=count("select count(f) from RhFuncionarioEntity f where f.empresaId=:tenant and f.projetoObraId=:project and f.situacao='ATIVO'",id);
        long engineer=em.createQuery("select count(u) from UsuarioEntity u where u.id=:id and u.empresaId=:tenant and u.ativo=true",Long.class)
            .setParameter("id",project.getEngenheiroResponsavelId()).setParameter("tenant",tenant()).getSingleResult();
        long engineerLinked=em.createQuery("select count(f) from RhFuncionarioEntity f where f.empresaId=:tenant and f.projetoObraId=:project and f.usuarioId=:engineerId and f.situacao='ATIVO'",Long.class)
            .setParameter("tenant",tenant()).setParameter("project",id).setParameter("engineerId",project.getEngenheiroResponsavelId()).getSingleResult();
        if(engineer>0&&engineerLinked==0)staff++;
        long teams=count("select count(e) from EquipeTrabalhoEntity e where e.projetoObraId=:project",id);
        long materials=count("select count(e) from ItemEstoqueEntity e where e.empresaId=:tenant and e.projetoObraId=:project",id);
        long stages=count("select count(e) from EtapaCronogramaEntity e where e.projetoObraId=:project",id);
        var models=em.createQuery("select e.documento from ModeloObraEntity e where e.empresaId=:tenant and e.projetoObraId=:project and e.arquivado=false",String.class)
            .setParameter("tenant",tenant()).setParameter("project",id).getResultList();
        long drawings=models.stream().filter(this::hasDrawing).count();
        long clients=count("select count(a) from AcessoExternoEntity a where a.empresaId=:tenant and a.projetoObraId=:project and a.perfil='CLIENTE' and a.unidadeImobiliariaId in (select u.id from UnidadeImobiliariaEntity u where u.projetoObraId=:project)",id);
        var exemptions=em.createQuery("select e from ProjetoConfiguracaoEtapaEntity e where e.empresaId=:tenant and e.projetoObraId=:project",ProjetoConfiguracaoEtapaEntity.class)
            .setParameter("tenant",tenant()).setParameter("project",id).getResultList();
        Map<String,ProjetoConfiguracaoEtapaEntity> byStep=new HashMap<>();exemptions.forEach(e->byStep.put(e.getEtapa(),e));
        Map<String,Long> quantities=Map.of("responsaveis",staff,"equipe",teams,"materiais",materials,"cronograma",stages,"planta2d",drawings,"cliente",clients);
        List<Map<String,Object>> steps=new ArrayList<>();
        for(String key:List.of("responsaveis","equipe","materiais","cronograma","planta2d","cliente")){
            long n=quantities.get(key);var exemption=byStep.get(key);
            var row=new LinkedHashMap<String,Object>();row.put("etapa",key);row.put("status",n>0?"CONCLUIDA":exemption!=null?"NAO_SE_APLICA":"PENDENTE");row.put("quantidade",n);
            if(exemption!=null)row.put("motivoDispensa",exemption.getJustificativa());steps.add(row);
        }
        return Map.of("projetoObraId",id,"etapas",steps);
    }

    @GetMapping("/{id}/configuracao/opcoes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public Map<String,Object> options(@PathVariable Long id){
        project(id);
        var employees=em.createQuery("select f.id,f.nome,f.projetoObraId,f.equipeId from RhFuncionarioEntity f where f.empresaId=:tenant and f.situacao='ATIVO' and (f.projetoObraId is null or f.projetoObraId=:project) order by f.nome",Object[].class)
            .setParameter("tenant",tenant()).setParameter("project",id).setMaxResults(500).getResultList();
        var teams=em.createQuery("select e.id,e.nomeEquipe from EquipeTrabalhoEntity e where e.projetoObraId=:project order by e.nomeEquipe",Object[].class)
            .setParameter("project",id).getResultList();
        return Map.of("funcionarios",employees.stream().map(f->Map.of("id",f[0],"nome",f[1],"equipeId",f[3]==null?0L:f[3])).toList(),
            "equipes",teams.stream().map(t->Map.of("id",t[0],"nome",t[1])).toList());
    }
    private boolean hasDrawing(String value){
        try{JsonNode doc=mapper.readTree(value);return doc.path("elementos").isArray()&&!doc.path("elementos").isEmpty();}
        catch(Exception ignored){return false;}
    }

    @PutMapping("/{id}/responsaveis") @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public Map<String,Object> assign(@PathVariable Long id,@Valid @RequestBody AssignmentRequest r,Authentication auth){
        var project=project(id);Long actor=Long.valueOf(auth.getName());
        if(r.equipeId()!=null){var team=em.find(EquipeTrabalhoEntity.class,r.equipeId());if(team==null||!id.equals(team.getProjetoObraId()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A equipe precisa pertencer a esta obra.");}
        Set<Long> seen=new HashSet<>();int updated=0;
        for(var entry:r.funcionarios()){
            if(!seen.add(entry.funcionarioId()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Funcionário repetido na lista.");
            var employee=em.find(RhFuncionarioEntity.class,entry.funcionarioId(),LockModeType.PESSIMISTIC_WRITE);
            if(employee==null||!tenant().equals(employee.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Funcionário não encontrado nesta empresa.");
            if(!"ATIVO".equals(employee.getSituacao()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Somente funcionários ativos podem ser vinculados.");
            if(employee.getProjetoObraId()!=null&&!id.equals(employee.getProjetoObraId()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Funcionário já está alocado a outra obra; o RH precisa resolver a transferência.");
            Long selectedTeam=entry.equipeId()!=null?entry.equipeId():r.equipeId();
            if(selectedTeam!=null){var employeeTeam=em.find(EquipeTrabalhoEntity.class,selectedTeam);if(employeeTeam==null||!id.equals(employeeTeam.getProjetoObraId()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A equipe precisa pertencer a esta obra.");}
            var before=rhHistory.snapshot(employee);employee.setProjetoObraId(id);if(selectedTeam!=null)employee.setEquipeId(selectedTeam);
            rhHistory.record(employee,before,actor,r.motivo());updated++;
        }
        em.persist(LogAuditoriaEntity.builder().empresaId(tenant()).usuarioId(actor).acao("VINCULAR_RESPONSAVEIS_OBRA").entidadeAfetada("projeto_obra").entidadeId(project.getId()).build());
        return Map.of("vinculados",updated);
    }

    @PutMapping("/{id}/configuracao/{etapa}/dispensa") @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public Map<String,Object> waive(@PathVariable Long id,@PathVariable String etapa,@Valid @RequestBody WaiverRequest r,Authentication auth){
        project(id);if(!WAIVABLE_STEPS.contains(etapa))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Esta etapa é necessária e não pode ser dispensada.");
        var rows=em.createQuery("select e from ProjetoConfiguracaoEtapaEntity e where e.empresaId=:tenant and e.projetoObraId=:project and e.etapa=:step",ProjetoConfiguracaoEtapaEntity.class)
            .setParameter("tenant",tenant()).setParameter("project",id).setParameter("step",etapa).getResultList();
        var e=rows.isEmpty()?new ProjetoConfiguracaoEtapaEntity():rows.get(0);e.setEmpresaId(tenant());e.setProjetoObraId(id);e.setEtapa(etapa);e.setJustificativa(r.justificativa().trim());e.setUsuarioId(Long.valueOf(auth.getName()));
        if(rows.isEmpty())em.persist(e);
        em.persist(LogAuditoriaEntity.builder().empresaId(tenant()).usuarioId(Long.valueOf(auth.getName())).acao("DISPENSAR_ETAPA_CONFIGURACAO").entidadeAfetada("projeto_configuracao_etapa").entidadeId(id).build());
        return Map.of("etapa",etapa,"status","NAO_SE_APLICA");
    }
    public record EmployeeAssignment(@NotNull @Positive Long funcionarioId,@Positive Long equipeId){}
    public record AssignmentRequest(@Positive Long equipeId,@NotEmpty @Size(max=500) List<@Valid EmployeeAssignment> funcionarios,@NotBlank @Size(max=500) String motivo){}
    public record WaiverRequest(@NotBlank @Size(min=5,max=300) String justificativa){}
}
