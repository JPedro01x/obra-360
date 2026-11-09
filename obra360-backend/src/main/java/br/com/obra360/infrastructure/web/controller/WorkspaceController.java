package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
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
import java.time.LocalDate;
import java.util.*;

/** Database-backed operations. No fixtures or cross-organization queries. */
@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','MESTRE_OBRA','ALMOXARIFE','FINANCEIRO','AUDITOR','INCORPORADOR')")
public class WorkspaceController {
    private final EntityManager em;
    private final br.com.obra360.application.service.LicencaService licenca;
    private static final String PROJECT_SCOPE = "e.projetoObraId in (select p.id from ProjetoObraEntity p where p.empresaId = :tenant)";
    private static final Map<String, String> QUERIES = Map.ofEntries(
        Map.entry("acessos", "from AcessoExternoEntity e where e.empresaId = :tenant"),
        Map.entry("fornecedores", "from FornecedorB2BEntity e where e.empresaId = :tenant"),
        Map.entry("movimentacoes", "from MovimentacaoEstoqueEntity e where e.itemEstoqueId in (select i.id from ItemEstoqueEntity i where i.empresaId = :tenant)"),
        Map.entry("consumos", "from ConsumoOrdemEntity e where e.itemEstoqueId in (select i.id from ItemEstoqueEntity i where i.empresaId = :tenant)"),
        Map.entry("usuarios", "from UsuarioEntity e where e.empresaId = :tenant"),
        Map.entry("projetos", "from ProjetoObraEntity e where e.empresaId = :tenant"),
        Map.entry("estoque", "from ItemEstoqueEntity e where e.empresaId = :tenant and " + PROJECT_SCOPE),
        Map.entry("documentos", "from DocumentoProjetoEntity e where " + PROJECT_SCOPE),
        Map.entry("cronograma", "from EtapaCronogramaEntity e where " + PROJECT_SCOPE),
        Map.entry("qualidade", "from OcorrenciaQualidadeEntity e where " + PROJECT_SCOPE),
        Map.entry("equipes", "from EquipeTrabalhoEntity e where " + PROJECT_SCOPE),
        Map.entry("unidades", "from UnidadeImobiliariaEntity e where " + PROJECT_SCOPE),
        Map.entry("contratos", "from ContratoServicoEntity e where e.empresaId = :tenant and " + PROJECT_SCOPE),
        Map.entry("cotacoes", "from CotacaoB2BEntity e where e.empresaId = :tenant"),
        Map.entry("auditoria", "from LogAuditoriaEntity e where e.empresaId = :tenant"),
        Map.entry("ordens", "from SolicitacaoServicoEntity e where e.contratoServicoId in (select c.id from ContratoServicoEntity c where c.empresaId = :tenant)"),
        Map.entry("garantias", "from GarantiaPosVendaEntity e where e.unidadeImobiliariaId in (select u.id from UnidadeImobiliariaEntity u where u.projetoObraId in (select p.id from ProjetoObraEntity p where p.empresaId = :tenant))")
    );

    @GetMapping("/sessao")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> session(Authentication auth) {
        UsuarioEntity user = em.find(UsuarioEntity.class, Long.valueOf(auth.getName()));
        EmpresaEntity company = em.find(EmpresaEntity.class, TenantContext.getCurrentTenant());
        if (company == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Empresa do usuário não encontrada.");
        return Map.of("nome", user.getNome(), "email", user.getEmail(), "perfil", user.getPerfil(), "empresa", company);
    }

    private void checkResource(String resource, Authentication auth) {
        if (!QUERIES.containsKey(resource)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (Set.of("usuarios","acessos").contains(resource) && auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (Set.of("auditoria", "contratos", "cotacoes", "unidades").contains(resource) &&
            auth.getAuthorities().stream().noneMatch(a -> Set.of("ROLE_SUPER_ADMIN", "ROLE_GERENTE_OBRA", "ROLE_FINANCEIRO", "ROLE_AUDITOR", "ROLE_INCORPORADOR").contains(a.getAuthority()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/opcoes/{resource}")
    public List<Map<String,Object>> options(@PathVariable String resource,@RequestParam(defaultValue="") String q) {
        Map<String,String[]> definitions=Map.of(
            "projetos",new String[]{"ProjetoObraEntity","nome","e.empresaId=:tenant"},
            "equipes",new String[]{"EquipeTrabalhoEntity","nomeEquipe",PROJECT_SCOPE},
            "estoque",new String[]{"ItemEstoqueEntity","nome","e.empresaId=:tenant"},
            "contratos",new String[]{"ContratoServicoEntity","numeroContrato","e.empresaId=:tenant"},
            "fornecedores",new String[]{"FornecedorB2BEntity","razaoSocial","e.empresaId=:tenant"},
            "usuarios",new String[]{"UsuarioEntity","nome","e.empresaId=:tenant and e.ativo=true"},
            "lideres",new String[]{"UsuarioEntity","nome","e.empresaId=:tenant and e.ativo=true and e.perfil in ('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','MESTRE_OBRA')"},
            "engenheiros",new String[]{"UsuarioEntity","nome","e.empresaId=:tenant and e.ativo=true and e.perfil in ('ENGENHEIRO','GERENTE_OBRA')"},
            "unidades",new String[]{"UnidadeImobiliariaEntity","codigoUnidade",PROJECT_SCOPE},
            "ordens",new String[]{"SolicitacaoServicoEntity","codigoProtocolo","e.contratoServicoId in (select c.id from ContratoServicoEntity c where c.empresaId=:tenant) and e.statusOs in ('ABERTO','EM_ANDAMENTO')"});
        String[] d=definitions.get(resource);
        if(d==null || q.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var rows=em.createQuery("select e.id,e."+d[1]+" from "+d[0]+" e where "+d[2]+" and lower(e."+d[1]+") like :q order by e."+d[1],Object[].class)
            .setParameter("tenant",TenantContext.getCurrentTenant()).setParameter("q","%"+q.toLowerCase(Locale.ROOT)+"%").setMaxResults(100).getResultList();
        return rows.stream().map(r->Map.<String,Object>of("id",r[0],"nome",r[1])).toList();
    }

    @GetMapping("/resumo")
    public Map<String,Object> summary() {
        Long tenant=TenantContext.getCurrentTenant();
        Long orders=em.createQuery("select count(e) "+QUERIES.get("ordens")+" and e.statusOs in ('ABERTO','EM_ANDAMENTO')",Long.class).setParameter("tenant",tenant).getSingleResult();
        Long late=em.createQuery("select count(e) "+QUERIES.get("ordens")+" and e.statusOs in ('ABERTO','EM_ANDAMENTO') and e.dataLimiteSla<:now",Long.class).setParameter("tenant",tenant).setParameter("now",java.time.OffsetDateTime.now()).getSingleResult();
        Long low=em.createQuery("select count(e) "+QUERIES.get("estoque")+" and e.quantidadeAtual<e.estoqueMinimo",Long.class).setParameter("tenant",tenant).getSingleResult();
        var cost=em.createQuery("select coalesce(sum(e.custoTotalInsumo),0) "+QUERIES.get("consumos"),BigDecimal.class).setParameter("tenant",tenant).getSingleResult();
        return Map.of("ordensAbertas",orders,"ordensAtrasadas",late,"materiaisAbaixoMinimo",low,"custoConsumido",cost);
    }

    @GetMapping("/registros/{resource}")
    public Map<String, Object> list(@PathVariable String resource, @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "25") int size, Authentication auth) {
        checkResource(resource, auth);
        if (page < 0 || page > 1000000 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        String query = QUERIES.get(resource);
        Long tenant = TenantContext.getCurrentTenant();
        var rows = em.createQuery("select e " + query + " order by e.id desc")
            .setParameter("tenant", tenant).setFirstResult(page * size).setMaxResults(size).getResultList();
        Long total = em.createQuery("select count(e) " + query, Long.class).setParameter("tenant", tenant).getSingleResult();
        return Map.of("items", rows, "total", total, "page", page, "size", size);
    }

    @PostMapping("/projetos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public ProjetoObraEntity createProject(@Valid @RequestBody ProjectRequest request, Authentication auth) {
        licenca.project(TenantContext.getCurrentTenant());
        if (request.dataPrevisaoFim().isBefore(request.dataInicio())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prazo anterior ao início.");
        var engineer = em.find(UsuarioEntity.class, request.engenheiroResponsavelId());
        if (engineer == null || !Objects.equals(engineer.getEmpresaId(), TenantContext.getCurrentTenant()) ||
            !Boolean.TRUE.equals(engineer.getAtivo()) || !Set.of("ENGENHEIRO", "GERENTE_OBRA").contains(engineer.getPerfil())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um engenheiro ativo da sua empresa.");
        }
        var project = ProjetoObraEntity.builder().empresaId(TenantContext.getCurrentTenant())
            .engenheiroResponsavelId(engineer.getId()).nome(request.nome().trim()).vgvEstimado(request.vgvEstimado())
            .areaTotalM2(request.areaTotalM2()).dataInicio(request.dataInicio()).dataPrevisaoFim(request.dataPrevisaoFim()).build();
        em.persist(project);
        em.persist(LogAuditoriaEntity.builder().empresaId(TenantContext.getCurrentTenant()).usuarioId(Long.valueOf(auth.getName()))
            .acao("CRIAR_PROJETO").entidadeAfetada("projeto_obra").entidadeId(project.getId()).build());
        return project;
    }

    @GetMapping("/engenheiros")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public List<Map<String, Object>> engineers() {
        return em.createQuery("select u from UsuarioEntity u where u.empresaId = :tenant and u.ativo = true and u.perfil in ('ENGENHEIRO','GERENTE_OBRA') order by u.nome", UsuarioEntity.class)
            .setParameter("tenant", TenantContext.getCurrentTenant()).getResultList().stream()
            .map(u -> Map.<String, Object>of("id", u.getId(), "nome", u.getNome())).toList();
    }

    @PutMapping("/projetos/{id}") @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public ProjetoObraEntity updateProject(@PathVariable Long id,@Valid @RequestBody ProjectRequest r,Authentication a) {
        var p=em.find(ProjetoObraEntity.class,id,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(p==null || !TenantContext.getCurrentTenant().equals(p.getEmpresaId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var engineer=em.find(UsuarioEntity.class,r.engenheiroResponsavelId());
        if(engineer==null || !p.getEmpresaId().equals(engineer.getEmpresaId()) || !Boolean.TRUE.equals(engineer.getAtivo()) || !Set.of("ENGENHEIRO","GERENTE_OBRA").contains(engineer.getPerfil()) || r.dataPrevisaoFim().isBefore(r.dataInicio())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        p.setNome(r.nome().trim());p.setEngenheiroResponsavelId(r.engenheiroResponsavelId());p.setVgvEstimado(r.vgvEstimado());p.setAreaTotalM2(r.areaTotalM2());p.setDataInicio(r.dataInicio());p.setDataPrevisaoFim(r.dataPrevisaoFim());
        em.persist(LogAuditoriaEntity.builder().empresaId(p.getEmpresaId()).usuarioId(Long.valueOf(a.getName())).acao("ATUALIZAR_PROJETO").entidadeAfetada("projeto_obra").entidadeId(id).build());return p;
    }

    public record ProjectRequest(@NotBlank @Size(max = 150) String nome, @NotNull @Positive Long engenheiroResponsavelId,
        @NotNull @DecimalMin("0") @Digits(integer = 13, fraction = 2) BigDecimal vgvEstimado,
        @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 10, fraction = 2) BigDecimal areaTotalM2,
        @NotNull LocalDate dataInicio, @NotNull LocalDate dataPrevisaoFim) {}
}
