package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** HR data is deliberately separate from general operational lists. */
@RestController @RequestMapping("/api/v1/workspace/rh") @RequiredArgsConstructor
@Transactional @PreAuthorize("hasAnyRole('SUPER_ADMIN','RH')")
public class RecursosHumanosController {
    private final EntityManager em;
    private final OperacaoService operation;
    private final ObjectMapper mapper;
    private final br.com.obra360.application.service.RhHistoricoService historico;
    private final br.com.obra360.application.service.AcessoFuncionarioService acessos;
    private final br.com.obra360.application.service.PlanningDates dates;
    private static final Map<String,Class<? extends RhBase>> TYPES=Map.of(
        "estrutura",RhEstruturaEntity.class,"funcionarios",RhFuncionarioEntity.class,"ponto",RhPontoEntity.class,
        "afastamentos",RhAfastamentoEntity.class,"beneficios",RhBeneficioEntity.class,"folhas",RhFolhaEntity.class,
        "lancamentos",RhLancamentoEntity.class,"treinamentos",RhTreinamentoEntity.class,"vagas",RhVagaEntity.class,"candidatos",RhCandidatoEntity.class);
    private Long tenant(){return TenantContext.getCurrentTenant();}
    private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private void conflict(String message){throw new ResponseStatusException(HttpStatus.CONFLICT,message);}
    private void audit(String action,RhBase e,Authentication a){operation.audit(action,e.getClass().getSimpleName(),e.getId(),Long.valueOf(a.getName()));}
    private <T extends RhBase> T own(Class<T> type,Long id){
        if(id==null)throw bad("Vínculo obrigatório não informado.");
        T e=em.find(type,id,LockModeType.PESSIMISTIC_WRITE);
        if(e==null||!tenant().equals(e.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return e;
    }
    private <T extends RhBase> T edit(Class<T> type,Long id,long version){
        if(id==null){try{T e=type.getDeclaredConstructor().newInstance();e.setEmpresaId(tenant());return e;}catch(ReflectiveOperationException e){throw new IllegalStateException(e);}}
        T e=own(type,id);if(e.getVersao()!=version)conflict("Registro alterado por outra sessão. Atualize antes de salvar.");return e;
    }
    private <T extends RhBase> T save(T e,Authentication a){boolean fresh=e.getId()==null;if(fresh)em.persist(e);em.flush();audit(fresh?"RH_CADASTRAR":"RH_ATUALIZAR",e,a);return e;}
    private RhFuncionarioEntity employee(Long id){return own(RhFuncionarioEntity.class,id);}
    private RhFuncionarioEntity activeEmployee(Long id){var e=employee(id);if(!"ATIVO".equals(e.getSituacao()))conflict("Funcionário desligado ou inativo.");return e;}
    private void employmentDate(RhFuncionarioEntity e,LocalDate date){if(date.isBefore(e.getAdmissao())||(e.getDesligamento()!=null&&date.isAfter(e.getDesligamento())))throw bad("Data fora do vínculo do funcionário.");}
    private void structure(Long department,Long job){var d=own(RhEstruturaEntity.class,department);var c=own(RhEstruturaEntity.class,job);if(!"DEPARTAMENTO".equals(d.getTipo())||!"CARGO".equals(c.getTipo())||!department.equals(c.getDepartamentoId())||!Boolean.TRUE.equals(d.getAtivo())||!Boolean.TRUE.equals(c.getAtivo()))throw bad("Selecione departamento e cargo ativos compatíveis.");}
    private String masked(String cpf){return "***.***."+cpf.substring(6,9)+"-**";}
    @SuppressWarnings("unchecked") private Object safe(RhBase e){if(e instanceof RhFuncionarioEntity f){Map<String,Object> value=mapper.convertValue(f,Map.class);value.put("cpf",masked(f.getCpf()));return value;}return e;}

    @GetMapping("/registros/{resource}") @Transactional(readOnly=true)
    public Map<String,Object> list(@PathVariable String resource,@RequestParam(defaultValue="0") @Min(0) int page,
        @RequestParam(defaultValue="25") @Min(1) @Max(100) int size,@RequestParam(required=false) Long funcionarioId,
        @RequestParam(required=false) Long folhaId,@RequestParam(defaultValue="") @Size(max=100) String q){
        var type=TYPES.get(resource);if(type==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        // MVC @Min constraints are also checked explicitly for older method validation setups.
        if(page<0||page>100000||size<1||size>100)throw bad("Página inválida.");
        String where=" from "+type.getSimpleName()+" e where e.empresaId=:t";
        Map<String,Object> params=new HashMap<>();params.put("t",tenant());
        if(funcionarioId!=null&&Set.of("ponto","afastamentos","beneficios","treinamentos","lancamentos").contains(resource)){where+=" and e.funcionarioId=:f";params.put("f",funcionarioId);}
        if(folhaId!=null&&resource.equals("lancamentos")){where+=" and e.folhaId=:h";params.put("h",folhaId);}
        if(!q.isBlank()&&Set.of("funcionarios","estrutura","vagas","candidatos").contains(resource)){
            String field=resource.equals("vagas")?"titulo":"nome";where+=" and lower(e."+field+") like :q";params.put("q","%"+q.trim().toLowerCase(Locale.ROOT)+"%");}
        var count=em.createQuery("select count(e)"+where,Long.class);var rows=em.createQuery("select e"+where+" order by e.id desc",type);
        params.forEach((k,v)->{count.setParameter(k,v);rows.setParameter(k,v);});
        return Map.of("items",rows.setFirstResult(page*size).setMaxResults(size).getResultList().stream().map(this::safe).toList(),"total",count.getSingleResult(),"page",page,"size",size);
    }
    @GetMapping("/registros/{resource}/{id}")
    public RhBase detail(@PathVariable String resource,@PathVariable Long id){var type=TYPES.get(resource);if(type==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return own(type,id);}
    @GetMapping("/opcoes/{resource}") @Transactional(readOnly=true)
    public List<Map<String,Object>> options(@PathVariable String resource,@RequestParam(defaultValue="") @Size(max=100) String q,
        @RequestParam(required=false) Long departamentoId,@RequestParam(required=false) Long projetoObraId){
        String type,field,extra="";
        switch(resource){
            case "departamentos" -> {type="RhEstruturaEntity";field="nome";extra=" and e.tipo='DEPARTAMENTO' and e.ativo=true";}
            case "cargos" -> {type="RhEstruturaEntity";field="nome";extra=" and e.tipo='CARGO' and e.ativo=true";}
            case "funcionarios" -> {type="RhFuncionarioEntity";field="nome";}
            case "folhas" -> {type="RhFolhaEntity";field="competencia";}
            case "vagas" -> {type="RhVagaEntity";field="titulo";}
            case "usuarios" -> {type="UsuarioEntity";field="nome";extra=" and e.ativo=true";}
            case "projetos" -> {type="ProjetoObraEntity";field="nome";}
            case "equipes" -> {type="EquipeTrabalhoEntity";field="nomeEquipe";extra=" and e.projetoObraId in (select p.id from ProjetoObraEntity p where p.empresaId=:t)";}
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        String scope=resource.equals("equipes")?"1=1":"e.empresaId=:t";
        if(departamentoId!=null) {
            if(!resource.equals("cargos") || departamentoId<1)throw bad("Filtro de departamento inválido.");
            var department=own(RhEstruturaEntity.class,departamentoId);
            if(!"DEPARTAMENTO".equals(department.getTipo()))throw bad("Selecione um departamento.");
            extra+=" and e.departamentoId=:department";
        }
        if(projetoObraId!=null) {
            if(!resource.equals("equipes") || projetoObraId<1)throw bad("Filtro de obra inválido.");
            var project=em.find(ProjetoObraEntity.class,projetoObraId);
            if(project==null || !tenant().equals(project.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            extra+=" and e.projetoObraId=:project";
        }
        var query=em.createQuery("select e.id,e."+field+" from "+type+" e where "+scope+extra+" and lower(e."+field+") like :q order by e."+field,Object[].class)
            .setParameter("t",tenant()).setParameter("q","%"+q.trim().toLowerCase(Locale.ROOT)+"%").setMaxResults(200);
        if(departamentoId!=null)query.setParameter("department",departamentoId);
        if(projetoObraId!=null)query.setParameter("project",projetoObraId);
        return query.getResultList().stream().map(r->Map.<String,Object>of("id",r[0],"nome",r[1])).toList();
    }
    @GetMapping("/resumo") @Transactional(readOnly=true)
    public Map<String,Object> summary(){
        long staff=em.createQuery("select count(e) from RhFuncionarioEntity e where e.empresaId=:t and e.situacao='ATIVO'",Long.class).setParameter("t",tenant()).getSingleResult();
        long pending=em.createQuery("select count(e) from RhAfastamentoEntity e where e.empresaId=:t and e.situacao='SOLICITADO'",Long.class).setParameter("t",tenant()).getSingleResult();
        long expiring=em.createQuery("select count(e) from RhTreinamentoEntity e where e.empresaId=:t and e.validade<=:d",Long.class).setParameter("t",tenant()).setParameter("d",LocalDate.now().plusDays(30)).getSingleResult();
        long vacancies=em.createQuery("select count(e) from RhVagaEntity e where e.empresaId=:t and e.situacao='ABERTA'",Long.class).setParameter("t",tenant()).getSingleResult();
        return Map.of("funcionariosAtivos",staff,"solicitacoesPendentes",pending,"validadesAte30Dias",expiring,"vagasAbertas",vacancies);
    }

    @RequestMapping(value={"/estrutura","/estrutura/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhEstruturaEntity structureSave(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody StructureRequest r,Authentication a){
        var e=edit(RhEstruturaEntity.class,id,versao);
        if(id!=null&&!e.getTipo().equals(r.tipo()))throw bad("Tipo da estrutura não pode ser alterado.");
        if("CARGO".equals(r.tipo())){var d=own(RhEstruturaEntity.class,r.departamentoId());if(!"DEPARTAMENTO".equals(d.getTipo())||!Boolean.TRUE.equals(d.getAtivo()))throw bad("Departamento inválido.");}
        if(id!=null&&Boolean.FALSE.equals(r.ativo())){
            long used=em.createQuery("select count(f) from RhFuncionarioEntity f where f.empresaId=:t and f.situacao='ATIVO' and (f.departamentoId=:id or f.cargoId=:id)",Long.class).setParameter("t",tenant()).setParameter("id",id).getSingleResult();
            long children=em.createQuery("select count(c) from RhEstruturaEntity c where c.empresaId=:t and c.departamentoId=:id and c.ativo=true",Long.class).setParameter("t",tenant()).setParameter("id",id).getSingleResult();
            if(used+children>0)conflict("Estrutura possui funcionários ou cargos ativos.");
        }
        if(id!=null&&"CARGO".equals(e.getTipo())&&!Objects.equals(e.getDepartamentoId(),r.departamentoId()))conflict("Crie um novo cargo para mudar seu departamento.");
        e.setNome(r.nome().trim());e.setTipo(r.tipo());e.setDepartamentoId("CARGO".equals(r.tipo())?r.departamentoId():null);e.setAtivo(r.ativo());return save(e,a);
    }
    @RequestMapping(value={"/funcionarios","/funcionarios/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public Map<String,Object> employeeSave(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody EmployeeRequest r,Authentication a){
        var e=edit(RhFuncionarioEntity.class,id,versao);structure(r.departamentoId(),r.cargoId());
        if(!validCpf(r.cpf()))throw bad("CPF inválido. Informe os 11 dígitos.");
        if(r.nascimento()!=null&&(!r.nascimento().isBefore(r.admissao())||r.nascimento().isAfter(LocalDate.now())))throw bad("Nascimento deve ser anterior à admissão.");
        if(r.projetoObraId()!=null)operation.project(r.projetoObraId());
        if(r.equipeId()!=null){var team=operation.team(r.equipeId());if(team==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);operation.project(team.getProjetoObraId());if(!Objects.equals(team.getProjetoObraId(),r.projetoObraId()))throw bad("Equipe não pertence à obra selecionada.");}
        if(id!=null&&(!e.getAdmissao().equals(r.admissao())||!e.getCpf().equals(r.cpf())))conflict("CPF e admissão não podem ser alterados após o cadastro.");
        Map<String,Object> before=id==null?null:historico.snapshot(e);
        Long account=r.usuarioId()!=null?r.usuarioId():e.getUsuarioId();
        if(id!=null && !Objects.equals(account,e.getUsuarioId()) && !"SUPER_ADMIN".equals(operation.member(Long.valueOf(a.getName())).getPerfil()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Somente o administrador pode substituir a conta vinculada.");
        var access=(id==null || account!=null)?acessos.provision(account,id,r.nome(),r.email(),Long.valueOf(a.getName())):null;
        e.setMatricula(r.matricula().trim());e.setNome(r.nome().trim());e.setCpf(r.cpf());e.setEmail(r.email());e.setTelefone(r.telefone());e.setNascimento(r.nascimento());e.setAdmissao(r.admissao());e.setVinculo(r.vinculo());e.setDepartamentoId(r.departamentoId());e.setCargoId(r.cargoId());e.setProjetoObraId(r.projetoObraId());e.setEquipeId(r.equipeId());if(access!=null)e.setUsuarioId(access.user().getId());e.setSalarioBase(r.salarioBase());e.setJornadaSemanalMinutos(r.jornadaSemanalMinutos());if(id==null)e.setSituacao("ATIVO");save(e,a);historico.record(e,before,Long.valueOf(a.getName()),r.motivoAlteracao());
        Map<String,Object> result=mapper.convertValue(e,new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
        if(access!=null && access.initial()!=null) result.put("acessoInicial",access.initial());
        return result;
    }
    @PostMapping("/funcionarios/{id}/desligar")
    public RhFuncionarioEntity terminate(@PathVariable Long id,@Valid @RequestBody TerminationRequest r,Authentication a){var e=activeEmployee(id);if(e.getVersao()!=r.versao())conflict("Atualize o cadastro antes de desligar.");if(r.data().isBefore(e.getAdmissao())||r.data().isAfter(LocalDate.now()))throw bad("Data de desligamento inválida.");var before=historico.snapshot(e);acessos.deactivate(e,Long.valueOf(a.getName()));e.setSituacao("DESLIGADO");e.setDesligamento(r.data());historico.record(e,before,Long.valueOf(a.getName()),"Desligamento registrado com data informada "+r.data());audit("RH_DESLIGAR",e,a);em.flush();return e;}
    @RequestMapping(value={"/ponto","/ponto/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhPontoEntity attendance(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody AttendanceRequest r,Authentication a){
        var f=employee(r.funcionarioId());employmentDate(f,r.data());if(r.data().isAfter(LocalDate.now()))throw bad("Ponto não pode ser futuro.");
        if(!r.saida().isAfter(r.entrada()))throw bad("Saída deve ser posterior à entrada no mesmo dia.");
        long minutes=ChronoUnit.MINUTES.between(r.entrada(),r.saida());
        if((r.saidaIntervalo()==null)!=(r.retornoIntervalo()==null))throw bad("Preencha as duas marcações do intervalo.");
        if(r.saidaIntervalo()!=null){if(!r.saidaIntervalo().isAfter(r.entrada())||!r.retornoIntervalo().isAfter(r.saidaIntervalo())||!r.saida().isAfter(r.retornoIntervalo()))throw bad("Ordem das marcações inválida.");minutes-=ChronoUnit.MINUTES.between(r.saidaIntervalo(),r.retornoIntervalo());}
        var e=edit(RhPontoEntity.class,id,versao);if(id!=null&&"APROVADO".equals(e.getSituacao()))conflict("Ponto aprovado não pode ser editado.");
        e.setFuncionarioId(f.getId());e.setData(r.data());e.setEntrada(r.entrada());e.setSaidaIntervalo(r.saidaIntervalo());e.setRetornoIntervalo(r.retornoIntervalo());e.setSaida(r.saida());e.setMinutosTrabalhados((int)minutes);e.setObservacao(r.observacao());e.setSituacao("PENDENTE");return save(e,a);
    }
    @RequestMapping(value={"/afastamentos","/afastamentos/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhAfastamentoEntity absence(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody AbsenceRequest r,Authentication a){
        var f=activeEmployee(r.funcionarioId());employmentDate(f,r.inicio());if(r.fim().isBefore(r.inicio()))throw bad("Fim anterior ao início.");
        var e=edit(RhAfastamentoEntity.class,id,versao);if(id!=null&&!"SOLICITADO".equals(e.getSituacao()))conflict("Somente solicitações pendentes podem ser editadas.");
        if("FERIAS".equals(r.tipo())) dates.changedPeriod(r.inicio(),r.fim(),e.getInicio(),e.getFim());
        e.setFuncionarioId(f.getId());e.setTipo(r.tipo());e.setInicio(r.inicio());e.setFim(r.fim());e.setObservacao(r.observacao());e.setSituacao("SOLICITADO");return save(e,a);
    }
    @PostMapping("/afastamentos/{id}/decisao")
    public RhAfastamentoEntity decide(@PathVariable Long id,@Valid @RequestBody DecisionRequest r,Authentication a){
        var e=own(RhAfastamentoEntity.class,id);var f=employee(e.getFuncionarioId());
        if(e.getVersao()!=r.versao())conflict("Solicitação alterada. Atualize.");
        if(!"SOLICITADO".equals(e.getSituacao())&&!("APROVADO".equals(e.getSituacao())&&"CANCELADO".equals(r.situacao())))conflict("Transição inválida.");
        if("APROVADO".equals(r.situacao())){if(!"ATIVO".equals(f.getSituacao()))conflict("Funcionário desligado.");
            long overlapping=em.createQuery("select count(e) from RhAfastamentoEntity e where e.empresaId=:t and e.funcionarioId=:f and e.id<>:id and e.situacao='APROVADO' and e.inicio<=:fim and e.fim>=:inicio",Long.class).setParameter("t",tenant()).setParameter("f",f.getId()).setParameter("id",id).setParameter("fim",e.getFim()).setParameter("inicio",e.getInicio()).getSingleResult();if(overlapping>0)conflict("Já existe ausência aprovada no período.");}
        e.setSituacao(r.situacao());e.setAprovadorId(Long.valueOf(a.getName()));audit("RH_AUSENCIA_"+r.situacao(),e,a);return e;
    }
    @PostMapping("/ponto/{id}/aprovar")
    public RhPontoEntity approveAttendance(@PathVariable Long id,@Valid @RequestBody VersionRequest r,Authentication a){var e=own(RhPontoEntity.class,id);if(e.getVersao()!=r.versao()||!"PENDENTE".equals(e.getSituacao()))conflict("Ponto alterado ou já aprovado.");e.setSituacao("APROVADO");audit("RH_APROVAR_PONTO",e,a);return e;}
    @RequestMapping(value={"/beneficios","/beneficios/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhBeneficioEntity benefit(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody BenefitRequest r,Authentication a){
        employee(r.funcionarioId());if(r.fim()!=null&&r.fim().isBefore(r.inicio()))throw bad("Vigência inválida.");var e=edit(RhBeneficioEntity.class,id,versao);e.setFuncionarioId(r.funcionarioId());e.setNome(r.nome().trim());e.setValorEmpresa(r.valorEmpresa());e.setDescontoFuncionario(r.descontoFuncionario());e.setInicio(r.inicio());e.setFim(r.fim());e.setAtivo(r.ativo());return save(e,a);
    }
    @RequestMapping(value={"/treinamentos","/treinamentos/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhTreinamentoEntity training(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody TrainingRequest r,Authentication a){
        employee(r.funcionarioId());if(r.validade()!=null&&r.validade().isBefore(r.realizacao()))throw bad("Validade anterior à realização.");var e=edit(RhTreinamentoEntity.class,id,versao);e.setFuncionarioId(r.funcionarioId());e.setTipo(r.tipo());e.setTitulo(r.titulo().trim());e.setRealizacao(r.realizacao());e.setValidade(r.validade());e.setCargaHorariaMinutos(r.cargaHorariaMinutos());e.setInstituicao(r.instituicao());e.setObservacao(r.observacao());return save(e,a);
    }
    @RequestMapping(value={"/vagas","/vagas/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhVagaEntity vacancy(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody VacancyRequest r,Authentication a){structure(r.departamentoId(),r.cargoId());var e=edit(RhVagaEntity.class,id,versao);if("ABERTA".equals(r.situacao()))dates.changedPeriod(r.abertura(),r.abertura(),e.getAbertura(),e.getAbertura());e.setTitulo(r.titulo().trim());e.setDepartamentoId(r.departamentoId());e.setCargoId(r.cargoId());e.setQuantidade(r.quantidade());e.setDescricao(r.descricao().trim());e.setAbertura(r.abertura());e.setSituacao(r.situacao());return save(e,a);}
    @RequestMapping(value={"/candidatos","/candidatos/{id}"},method={RequestMethod.POST,RequestMethod.PUT})
    public RhCandidatoEntity candidate(@PathVariable(required=false) Long id,@RequestParam(defaultValue="-1") long versao,@Valid @RequestBody CandidateRequest r,Authentication a){var v=own(RhVagaEntity.class,r.vagaId());if(id==null&&!"ABERTA".equals(v.getSituacao()))conflict("Vaga não está aberta.");var e=edit(RhCandidatoEntity.class,id,versao);e.setVagaId(r.vagaId());e.setNome(r.nome().trim());e.setEmail(r.email().trim().toLowerCase(Locale.ROOT));e.setTelefone(r.telefone());e.setEtapa(r.etapa());e.setObservacao(r.observacao());return save(e,a);}
    @DeleteMapping("/candidatos/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCandidate(@PathVariable Long id,@RequestParam long versao,Authentication a){var e=edit(RhCandidatoEntity.class,id,versao);audit("RH_EXCLUIR_CANDIDATO",e,a);em.remove(e);}
    @PostMapping("/folhas")
    public RhFolhaEntity payroll(@Valid @RequestBody PayrollRequest r,Authentication a){try{YearMonth.parse(r.competencia());}catch(Exception ex){throw bad("Competência inválida.");}var e=new RhFolhaEntity();e.setEmpresaId(tenant());e.setCompetencia(r.competencia());e.setSituacao("ABERTA");e.setTotalProventos(BigDecimal.ZERO);e.setTotalDescontos(BigDecimal.ZERO);return save(e,a);}
    private RhFolhaEntity openPayroll(Long id){var f=own(RhFolhaEntity.class,id);if(!"ABERTA".equals(f.getSituacao()))conflict("Folha fechada não permite alterações.");return f;}
    @PostMapping("/lancamentos")
    public RhLancamentoEntity entry(@Valid @RequestBody EntryRequest r,Authentication a){var h=openPayroll(r.folhaId());var f=employee(r.funcionarioId());YearMonth month=YearMonth.parse(h.getCompetencia());if(f.getAdmissao().isAfter(month.atEndOfMonth())||(f.getDesligamento()!=null&&f.getDesligamento().isBefore(month.atDay(1))))throw bad("Funcionário sem vínculo nesta competência.");var e=new RhLancamentoEntity();e.setEmpresaId(tenant());e.setFolhaId(h.getId());e.setFuncionarioId(f.getId());e.setCodigo(r.codigo().trim().toUpperCase(Locale.ROOT));e.setDescricao(r.descricao().trim());e.setNatureza(r.natureza());e.setValor(r.valor());save(e,a);totals(h);return e;}
    private void totals(RhFolhaEntity h){for(String nature:List.of("PROVENTO","DESCONTO")){BigDecimal sum=em.createQuery("select coalesce(sum(e.valor),0) from RhLancamentoEntity e where e.empresaId=:t and e.folhaId=:id and e.natureza=:n",BigDecimal.class).setParameter("t",tenant()).setParameter("id",h.getId()).setParameter("n",nature).getSingleResult();if(nature.equals("PROVENTO"))h.setTotalProventos(sum);else h.setTotalDescontos(sum);}}
    @DeleteMapping("/lancamentos/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEntry(@PathVariable Long id,@RequestParam long versao,Authentication a){var e=edit(RhLancamentoEntity.class,id,versao);var h=openPayroll(e.getFolhaId());audit("RH_EXCLUIR_LANCAMENTO",e,a);em.remove(e);em.flush();totals(h);}
    @PostMapping("/folhas/{id}/fechar")
    public RhFolhaEntity closePayroll(@PathVariable Long id,@Valid @RequestBody VersionRequest r,Authentication a){var h=openPayroll(id);if(h.getVersao()!=r.versao())conflict("Folha alterada. Atualize.");totals(h);
        long count=em.createQuery("select count(e) from RhLancamentoEntity e where e.empresaId=:t and e.folhaId=:h",Long.class).setParameter("t",tenant()).setParameter("h",id).getSingleResult();if(count==0)conflict("Folha sem lançamentos.");
        var balances=em.createQuery("select e.funcionarioId,sum(case when e.natureza='PROVENTO' then e.valor else -e.valor end) from RhLancamentoEntity e where e.empresaId=:t and e.folhaId=:h group by e.funcionarioId",Object[].class).setParameter("t",tenant()).setParameter("h",id).getResultList();if(balances.stream().anyMatch(v->((BigDecimal)v[1]).signum()<0))conflict("Funcionário com líquido negativo. Revise os lançamentos.");h.setSituacao("FECHADA");audit("RH_FECHAR_FOLHA",h,a);return h;}
    @PostMapping("/folhas/{id}/pagar")
    public RhFolhaEntity payPayroll(@PathVariable Long id,@Valid @RequestBody PaymentRequest r,Authentication a){var h=own(RhFolhaEntity.class,id);if(h.getVersao()!=r.versao()||!"FECHADA".equals(h.getSituacao()))conflict("Somente folha fechada pode ser marcada como paga.");h.setSituacao("PAGA");h.setDataPagamento(r.data());audit("RH_REGISTRAR_PAGAMENTO",h,a);return h;}
    @GetMapping("/folhas/{id}/demonstrativo/{funcionarioId}")
    public Map<String,Object> statement(@PathVariable Long id,@PathVariable Long funcionarioId){var h=own(RhFolhaEntity.class,id);var f=employee(funcionarioId);var entries=em.createQuery("select e from RhLancamentoEntity e where e.empresaId=:t and e.folhaId=:h and e.funcionarioId=:f order by e.codigo",RhLancamentoEntity.class).setParameter("t",tenant()).setParameter("h",id).setParameter("f",funcionarioId).getResultList();BigDecimal pro=BigDecimal.ZERO,discount=BigDecimal.ZERO;for(var e:entries){if(e.getNatureza().equals("PROVENTO"))pro=pro.add(e.getValor());else discount=discount.add(e.getValor());}return Map.of("funcionario",f.getNome(),"matricula",f.getMatricula(),"competencia",h.getCompetencia(),"situacao",h.getSituacao(),"lancamentos",entries,"proventos",pro,"descontos",discount,"liquido",pro.subtract(discount));}
    private boolean validCpf(String cpf){if(!cpf.matches("[0-9]{11}")||cpf.chars().distinct().count()==1)return false;for(int len=9;len<=10;len++){int sum=0;for(int i=0;i<len;i++)sum+=(cpf.charAt(i)-'0')*(len+1-i);int digit=11-sum%11;if(digit>=10)digit=0;if(digit!=cpf.charAt(len)-'0')return false;}return true;}

    public record StructureRequest(@NotBlank @Pattern(regexp="DEPARTAMENTO|CARGO") String tipo,@NotBlank @Size(max=150) String nome,Long departamentoId,@NotNull Boolean ativo){}
    public record EmployeeRequest(@NotBlank @Size(max=30) String matricula,@NotBlank @Size(max=150) String nome,@NotBlank @Pattern(regexp="[0-9]{11}") String cpf,@Email @Size(max=120) String email,@Size(max=30) String telefone,LocalDate nascimento,@NotNull LocalDate admissao,@NotBlank @Pattern(regexp="CLT|PJ|ESTAGIO|APRENDIZ|TEMPORARIO|AUTONOMO") String vinculo,@NotNull Long departamentoId,@NotNull Long cargoId,Long projetoObraId,Long equipeId,Long usuarioId,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal salarioBase,@Min(1) @Max(10080) int jornadaSemanalMinutos,@Size(max=500) String motivoAlteracao){}
    public record TerminationRequest(@NotNull @PastOrPresent LocalDate data,@Min(0) long versao){}
    public record VersionRequest(@Min(0) long versao){}
    public record AttendanceRequest(@NotNull Long funcionarioId,@NotNull LocalDate data,@NotNull LocalTime entrada,LocalTime saidaIntervalo,LocalTime retornoIntervalo,@NotNull LocalTime saida,@Size(max=500) String observacao){}
    public record AbsenceRequest(@NotNull Long funcionarioId,@NotBlank @Pattern(regexp="FERIAS|LICENCA|ATESTADO|FALTA|FOLGA") String tipo,@NotNull LocalDate inicio,@NotNull LocalDate fim,@Size(max=500) String observacao){}
    public record DecisionRequest(@NotBlank @Pattern(regexp="APROVADO|REJEITADO|CANCELADO") String situacao,@Min(0) long versao){}
    public record BenefitRequest(@NotNull Long funcionarioId,@NotBlank @Size(max=100) String nome,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorEmpresa,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal descontoFuncionario,@NotNull LocalDate inicio,LocalDate fim,@NotNull Boolean ativo){}
    public record TrainingRequest(@NotNull Long funcionarioId,@NotBlank @Pattern(regexp="TREINAMENTO|EXAME|CERTIFICACAO") String tipo,@NotBlank @Size(max=150) String titulo,@NotNull LocalDate realizacao,LocalDate validade,@Min(0) @Max(100000) int cargaHorariaMinutos,@Size(max=150) String instituicao,@Size(max=500) String observacao){}
    public record VacancyRequest(@NotBlank @Size(max=150) String titulo,@NotNull Long departamentoId,@NotNull Long cargoId,@Min(1) @Max(10000) int quantidade,@NotBlank @Size(max=2000) String descricao,@NotNull LocalDate abertura,@NotBlank @Pattern(regexp="ABERTA|PAUSADA|ENCERRADA") String situacao){}
    public record CandidateRequest(@NotNull Long vagaId,@NotBlank @Size(max=150) String nome,@NotBlank @Email @Size(max=120) String email,@Size(max=30) String telefone,@NotBlank @Pattern(regexp="INSCRITO|TRIAGEM|ENTREVISTA|APROVADO|REPROVADO|DESISTENTE") String etapa,@Size(max=1000) String observacao){}
    public record PayrollRequest(@NotBlank @Pattern(regexp="[0-9]{4}-(0[1-9]|1[0-2])") String competencia){}
    public record EntryRequest(@NotNull Long folhaId,@NotNull Long funcionarioId,@NotBlank @Size(max=40) String codigo,@NotBlank @Size(max=150) String descricao,@NotBlank @Pattern(regexp="PROVENTO|DESCONTO") String natureza,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=13,fraction=2) BigDecimal valor){}
    public record PaymentRequest(@NotNull @PastOrPresent LocalDate data,@Min(0) long versao){}
}
