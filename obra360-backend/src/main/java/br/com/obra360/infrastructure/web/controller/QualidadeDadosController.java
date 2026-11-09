package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.OffsetDateTime;

@RestController @RequestMapping("/api/v1/workspace/dados") @RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')") @Transactional(readOnly=true)
public class QualidadeDadosController {
    private final EntityManager em;
    private Long tenant(){return TenantContext.getCurrentTenant();}
    private long count(String from){return em.createQuery("select count(e) "+from,Long.class).setParameter("t",tenant()).getSingleResult();}
    private Map<String,Object> alert(String code,long number,String text){return Map.of("codigo",code,"quantidade",number,"mensagem",text);}
    @GetMapping("/diagnostico")
    public Map<String,Object> diagnose(){
        var company=em.find(EmpresaEntity.class,tenant());
        var definitions=new LinkedHashMap<String,String>();
        definitions.put("usuarios","from UsuarioEntity e where e.empresaId=:t");definitions.put("obras","from ProjetoObraEntity e where e.empresaId=:t");definitions.put("fornecedores","from FornecedorB2BEntity e where e.empresaId=:t");definitions.put("materiais","from ItemEstoqueEntity e where e.empresaId=:t");definitions.put("contratos","from ContratoServicoEntity e where e.empresaId=:t");definitions.put("funcionarios","from RhFuncionarioEntity e where e.empresaId=:t");definitions.put("modelos","from ModeloObraEntity e where e.empresaId=:t");definitions.put("documentosRH","from RhDocumentoEntity e where e.empresaId=:t");definitions.put("vinculosExternos","from AcessoExternoEntity e where e.empresaId=:t");definitions.put("folhas","from RhFolhaEntity e where e.empresaId=:t");
        Map<String,Long> counts=new LinkedHashMap<>();definitions.forEach((key,from)->counts.put(key,count(from)));
        List<Map<String,Object>> alerts=new ArrayList<>();
        if("HOMOLOGACAO".equals(company.getAmbienteDados()))alerts.add(alert("BASE_DE_TESTE",1,"Base de homologação: os cadastros não representam fatos empresariais reais e não devem ser usados como produção."));
        if(counts.get("obras")==0)alerts.add(alert("SEM_OBRAS",0,"Nenhuma obra cadastrada. A operação ainda não pode ser homologada com dados de uma obra."));
        if(counts.get("usuarios")<2)alerts.add(alert("USUARIOS_INSUFICIENTES",counts.get("usuarios"),"Cadastre os responsáveis e valide seus acessos; apenas o administrador não comprova os fluxos por perfil."));
        if(counts.get("fornecedores")==0)alerts.add(alert("SEM_FORNECEDORES",0,"Catálogo de fornecedores vazio."));
        if(counts.get("funcionarios")==0)alerts.add(alert("SEM_FUNCIONARIOS",0,"RH ainda sem funcionários cadastrados."));
        long invalid=count("from ItemEstoqueEntity e where e.empresaId=:t and not exists (select p.id from ProjetoObraEntity p where p.id=e.projetoObraId and p.empresaId=:t)");
        if(invalid>0)alerts.add(alert("MATERIAL_OBRA_INVALIDA",invalid,"Materiais com vínculo de obra inconsistente. Corrija a origem antes de movimentar."));
        invalid=count("from RhFuncionarioEntity e where e.empresaId=:t and (not exists (select d.id from RhEstruturaEntity d where d.id=e.departamentoId and d.empresaId=:t and d.tipo='DEPARTAMENTO') or not exists(select c.id from RhEstruturaEntity c where c.id=e.cargoId and c.empresaId=:t and c.departamentoId=e.departamentoId and c.tipo='CARGO'))");
        if(invalid>0)alerts.add(alert("RH_ESTRUTURA_INVALIDA",invalid,"Funcionários com departamento/cargo incompatíveis."));
        long noCost=count("from ItemEstoqueEntity e where e.empresaId=:t and e.custoUnitarioMedio=0");if(noCost>0)alerts.add(alert("CUSTO_ZERO_REVISAR",noCost,"Materiais com custo zero: confirme se o valor é intencional antes de avaliar custos de consumo."));
        var cnpj=company.getCnpj();if(cnpj==null||cnpj.chars().distinct().count()==1)alerts.add(alert("IDENTIFICACAO_EMPRESA_REVISAR",1,"Identificador da empresa ausente ou de teste. Nenhuma consulta cadastral oficial foi realizada."));
        Map<String,Long> profiles=new TreeMap<>();em.createQuery("select e.perfil,count(e) from UsuarioEntity e where e.empresaId=:t and e.ativo=true group by e.perfil",Object[].class).setParameter("t",tenant()).getResultList().forEach(r->profiles.put((String)r[0],(Long)r[1]));
        return Map.of("geradoEm",OffsetDateTime.now(),"ambienteDados",company.getAmbienteDados(),"contagens",counts,"perfisAtivos",profiles,"alertas",alerts,"veracidadeComprovada",false,"escopo","Conferência estrutural do banco da empresa. Não comprova identidade cadastral, vínculos trabalhistas ou aceite humano da operação.");
    }
}
