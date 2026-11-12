package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.hibernate.Session;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional
public class ExclusaoCadastroService {
    private final EntityManager em;
    private final OperacaoService operations;
    public ExclusaoCadastroService(EntityManager em,OperacaoService operations) {this.em=em;this.operations=operations;}
    private void confirm(String provided,String current) {
        if(provided==null || !provided.trim().equals(current))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Digite o nome atual do cadastro para confirmar a exclusão.");
    }
    private void unused(String entity,String field,Long id,String reason) {
        long count=em.createQuery("select count(e) from "+entity+" e where e."+field+"=:id",Long.class).setParameter("id",id).getSingleResult();
        if(count>0)blocked(reason);
    }
    private void blocked(String reason) {throw new ResponseStatusException(HttpStatus.CONFLICT,"Não é possível excluir: "+reason+". Os vínculos e o histórico devem ser preservados.");}
    private void legacyUnused(String table,String column,Long id,String reason) {
        boolean linked=em.unwrap(Session.class).doReturningWork(connection->{
            var metadata=connection.getMetaData();
            String name=metadata.storesUpperCaseIdentifiers()?table.toUpperCase(java.util.Locale.ROOT):table;
            try(var tables=metadata.getTables(null,connection.getSchema(),name,new String[]{"TABLE"})) {
                if(!tables.next())return false;
            }
            // Identifiers come only from the fixed internal calls below, never request data.
            try(var statement=connection.prepareStatement("select 1 from "+table+" where "+column+"=?")) {
                statement.setLong(1,id);statement.setMaxRows(1);try(var rows=statement.executeQuery()){return rows.next();}
            }
        });
        if(linked)blocked(reason);
    }
    public void project(Long id,String confirmation,Long actor) {
        var project=em.createQuery("select p from ProjetoObraEntity p where p.id=:id and p.empresaId=:tenant",ProjetoObraEntity.class).setParameter("id",id).setParameter("tenant",TenantContext.getCurrentTenant()).setLockMode(LockModeType.PESSIMISTIC_WRITE).getResultList().stream().findFirst().orElse(null);
        if(project==null || !TenantContext.getCurrentTenant().equals(project.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        confirm(confirmation,project.getNome());
        for(String entity:new String[]{"EquipeTrabalhoEntity","ItemEstoqueEntity","ContratoServicoEntity","DocumentoProjetoEntity","EtapaCronogramaEntity","OcorrenciaQualidadeEntity","UnidadeImobiliariaEntity","ModeloObraEntity","AcessoExternoEntity","RhFuncionarioEntity"})
            unused(entity,"projetoObraId",id,"a obra possui cadastros vinculados");
        legacyUnused("elemento_bim_3d","projeto_obra_id",id,"a obra possui elementos BIM legados");
        operations.audit("EXCLUIR_PROJETO","projeto_obra",id,actor);em.remove(project);em.flush();
    }
    public void supplier(Long id,String confirmation,Long actor) {
        var supplier=em.createQuery("select f from FornecedorB2BEntity f where f.id=:id and f.empresaId=:tenant",FornecedorB2BEntity.class).setParameter("id",id).setParameter("tenant",TenantContext.getCurrentTenant()).setLockMode(LockModeType.PESSIMISTIC_WRITE).getResultList().stream().findFirst().orElse(null);
        if(supplier==null || !TenantContext.getCurrentTenant().equals(supplier.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        confirm(confirmation,supplier.getRazaoSocial());
        for(String entity:new String[]{"ContratoServicoEntity","CotacaoB2BEntity","AcessoExternoEntity"})
            unused(entity,"fornecedorB2bId",id,"o fornecedor possui contratos, cotações ou acessos vinculados");
        operations.audit("EXCLUIR_FORNECEDOR","fornecedor_b2b",id,actor);em.remove(supplier);em.flush();
    }
    public void team(Long id,String confirmation,Long actor) {
        // All team mutations use project -> team lock order.
        var team=operations.team(id);
        confirm(confirmation,team.getNomeEquipe());
        unused("SolicitacaoServicoEntity","equipeTrabalhoId",id,"a equipe possui ordens de serviço");
        unused("RhFuncionarioEntity","equipeId",id,"a equipe possui vínculos com funcionários");
        legacyUnused("colaborador","equipe_trabalho_id",id,"a equipe possui colaboradores legados");
        operations.audit("EXCLUIR_EQUIPE","equipe_trabalho",id,actor);em.remove(team);em.flush();
    }
}
