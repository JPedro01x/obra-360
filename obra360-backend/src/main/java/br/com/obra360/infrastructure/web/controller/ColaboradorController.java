package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/colaborador")
@Transactional(readOnly=true) @PreAuthorize("isAuthenticated()")
public class ColaboradorController {
    private final EntityManager em;
    public ColaboradorController(EntityManager em) {this.em=em;}
    private RhFuncionarioEntity employee(Authentication auth) {
        var rows=em.createQuery("select f from RhFuncionarioEntity f where f.empresaId=:t and f.usuarioId=:u and f.situacao='ATIVO'",RhFuncionarioEntity.class)
            .setParameter("t",TenantContext.getCurrentTenant()).setParameter("u",Long.valueOf(auth.getName())).setMaxResults(2).getResultList();
        if(rows.size()!=1) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Cadastro funcional ativo não encontrado para esta conta.");
        return rows.get(0);
    }
    @GetMapping
    public Map<String,Object> profile(Authentication auth) {
        var f=employee(auth);
        var department=em.find(RhEstruturaEntity.class,f.getDepartamentoId());var job=em.find(RhEstruturaEntity.class,f.getCargoId());
        return Map.of("nome",f.getNome(),"matricula",f.getMatricula(),"situacao",f.getSituacao(),"admissao",f.getAdmissao(),
            "departamento",department.getNome(),"cargo",job.getNome(),"jornadaSemanalMinutos",f.getJornadaSemanalMinutos());
    }
    @GetMapping("/ponto")
    public Map<String,Object> attendance(@RequestParam(defaultValue="0") int page,Authentication auth) {
        if(page<0 || page>100000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var f=employee(auth);
        String where=" from RhPontoEntity p where p.empresaId=:t and p.funcionarioId=:f";
        var rows=em.createQuery("select p"+where+" order by p.data desc,p.id desc",RhPontoEntity.class)
            .setParameter("t",f.getEmpresaId()).setParameter("f",f.getId()).setFirstResult(page*25).setMaxResults(25).getResultList();
        long count=em.createQuery("select count(p)"+where,Long.class).setParameter("t",f.getEmpresaId()).setParameter("f",f.getId()).getSingleResult();
        return Map.of("items",rows,"total",count,"page",page,"size",25);
    }
    @GetMapping("/folhas")
    public List<Map<String,Object>> payrolls(Authentication auth) {
        var f=employee(auth);
        return em.createQuery("select h from RhFolhaEntity h where h.empresaId=:t and h.situacao in ('FECHADA','PAGA') and h.id in (select l.folhaId from RhLancamentoEntity l where l.empresaId=:t and l.funcionarioId=:f) order by h.competencia desc",RhFolhaEntity.class)
            .setParameter("t",f.getEmpresaId()).setParameter("f",f.getId()).setMaxResults(120).getResultList().stream()
            .map(h->Map.<String,Object>of("id",h.getId(),"competencia",h.getCompetencia(),"situacao",h.getSituacao())).toList();
    }
    @GetMapping("/folhas/{id}")
    public Map<String,Object> statement(@PathVariable Long id,Authentication auth) {
        var f=employee(auth);var h=em.find(RhFolhaEntity.class,id);
        if(h==null || !f.getEmpresaId().equals(h.getEmpresaId()) || !Set.of("FECHADA","PAGA").contains(h.getSituacao()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var entries=em.createQuery("select l from RhLancamentoEntity l where l.empresaId=:t and l.funcionarioId=:f and l.folhaId=:h order by l.codigo",RhLancamentoEntity.class)
            .setParameter("t",f.getEmpresaId()).setParameter("f",f.getId()).setParameter("h",id).getResultList();
        if(entries.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        BigDecimal income=BigDecimal.ZERO,discount=BigDecimal.ZERO;
        for(var l:entries) {if("PROVENTO".equals(l.getNatureza())) income=income.add(l.getValor());else discount=discount.add(l.getValor());}
        return Map.of("competencia",h.getCompetencia(),"situacao",h.getSituacao(),"proventos",income,"descontos",discount,"liquido",income.subtract(discount),
            "lancamentos",entries.stream().map(l->Map.of("codigo",l.getCodigo(),"descricao",l.getDescricao(),"natureza",l.getNatureza(),"valor",l.getValor())).toList());
    }
}
