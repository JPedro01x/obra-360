package br.com.obra360.application.service;

import br.com.obra360.infrastructure.web.controller.AtendimentoController.NovaSolicitacao;
import br.com.obra360.infrastructure.web.controller.AtendimentoController.Resposta;
import org.springframework.stereotype.Service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class AtendimentoService {
    private final EntityManager em;
    private final OperacaoService operation;
    @Transactional(readOnly=true)
    public List<SolicitacaoAtendimentoEntity> list(Authentication a) {
        boolean admin=a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_SUPER_ADMIN"));
        var query=em.createQuery("select s from SolicitacaoAtendimentoEntity s where s.empresaId=:t"+(admin?"":" and s.usuarioId=:u")+" order by s.id desc",SolicitacaoAtendimentoEntity.class)
            .setParameter("t",TenantContext.getCurrentTenant());
        if(!admin)query.setParameter("u",Long.valueOf(a.getName()));
        return query.setMaxResults(200).getResultList();
    }
    public record Pagina(List<SolicitacaoAtendimentoEntity> items, long total, int page, int size) {}
    @Transactional(readOnly=true)
    public Pagina page(Authentication a, int page, int size, String status, String categoria) {
        if(page<0 || size<1 || size>100 || (long)page*size>Integer.MAX_VALUE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Página ou tamanho inválido.");
        if(status!=null && !Set.of("ABERTO","EM_ANALISE","CONCLUIDO").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Situação inválida.");
        if(categoria!=null && !Set.of("SUPORTE","PRIVACIDADE","EXPORTACAO","EXCLUSAO","CANCELAMENTO").contains(categoria))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Categoria inválida.");
        boolean admin=a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_SUPER_ADMIN"));
        String where=" where s.empresaId=:t"+(admin?"":" and s.usuarioId=:u")+(status==null?"":" and s.status=:status")+(categoria==null?"":" and s.categoria=:categoria");
        var count=em.createQuery("select count(s) from SolicitacaoAtendimentoEntity s"+where,Long.class);
        var items=em.createQuery("select s from SolicitacaoAtendimentoEntity s"+where+" order by s.id desc",SolicitacaoAtendimentoEntity.class);
        for(var query:List.of(count,items)) {
            query.setParameter("t",TenantContext.getCurrentTenant());
            if(!admin) query.setParameter("u",Long.valueOf(a.getName()));
            if(status!=null) query.setParameter("status",status);
            if(categoria!=null) query.setParameter("categoria",categoria);
        }
        return new Pagina(items.setFirstResult(page*size).setMaxResults(size).getResultList(),count.getSingleResult(),page,size);
    }
    
    public SolicitacaoAtendimentoEntity create(NovaSolicitacao r,Authentication a) {
        em.find(UsuarioEntity.class,Long.valueOf(a.getName()),LockModeType.PESSIMISTIC_WRITE);
        if(!Set.of("SUPORTE","PRIVACIDADE","EXPORTACAO","EXCLUSAO","CANCELAMENTO").contains(r.categoria())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        long pending=em.createQuery("select count(s) from SolicitacaoAtendimentoEntity s where s.usuarioId=:u and s.status<>'CONCLUIDO'",Long.class).setParameter("u",Long.valueOf(a.getName())).getSingleResult();
        if(pending>=20) throw new ResponseStatusException(HttpStatus.CONFLICT,"Você já possui 20 solicitações pendentes.");
        var s=new SolicitacaoAtendimentoEntity();s.setEmpresaId(TenantContext.getCurrentTenant());s.setUsuarioId(Long.valueOf(a.getName()));
        s.setCategoria(r.categoria());s.setAssunto(r.assunto().trim());s.setDescricao(r.descricao().trim());s.setStatus("ABERTO");s.setCriadoEm(OffsetDateTime.now());s.setAtualizadoEm(s.getCriadoEm());em.persist(s);
        operation.audit("ABRIR_ATENDIMENTO","solicitacao_atendimento",s.getId(),s.getUsuarioId());return s;
    }
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SolicitacaoAtendimentoEntity update(Long id,Resposta r,Authentication a) {
        var s=em.find(SolicitacaoAtendimentoEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(s==null||!s.getEmpresaId().equals(TenantContext.getCurrentTenant())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(s.getVersao()!=r.versao())throw new ResponseStatusException(HttpStatus.CONFLICT,"Solicitação alterada. Atualize antes de responder.");
        if(!Set.of("ABERTO","EM_ANALISE","CONCLUIDO").contains(r.status()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        s.setStatus(r.status());s.setResposta(r.resposta().trim());s.setAtualizadoEm(OffsetDateTime.now());
        operation.audit("RESPONDER_ATENDIMENTO","solicitacao_atendimento",s.getId(),Long.valueOf(a.getName()));em.flush();return s;
    }
}
