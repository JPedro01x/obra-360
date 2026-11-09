package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.*;

/** Requests remain pending until a responsible person actually handles them. */
@RestController @RequestMapping("/api/v1/workspace/atendimento")
@RequiredArgsConstructor @Transactional @PreAuthorize("isAuthenticated()")
public class AtendimentoController {
    private final EntityManager em;
    private final OperacaoService operation;
    @GetMapping @Transactional(readOnly=true)
    public List<SolicitacaoAtendimentoEntity> list(Authentication a) {
        boolean admin=a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_SUPER_ADMIN"));
        var query=em.createQuery("select s from SolicitacaoAtendimentoEntity s where s.empresaId=:t"+(admin?"":" and s.usuarioId=:u")+" order by s.id desc",SolicitacaoAtendimentoEntity.class)
            .setParameter("t",TenantContext.getCurrentTenant());
        if(!admin)query.setParameter("u",Long.valueOf(a.getName()));
        return query.setMaxResults(200).getResultList();
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoAtendimentoEntity create(@Valid @RequestBody NovaSolicitacao r,Authentication a) {
        em.find(UsuarioEntity.class,Long.valueOf(a.getName()),LockModeType.PESSIMISTIC_WRITE);
        if(!Set.of("SUPORTE","PRIVACIDADE","EXPORTACAO","EXCLUSAO","CANCELAMENTO").contains(r.categoria())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        long pending=em.createQuery("select count(s) from SolicitacaoAtendimentoEntity s where s.usuarioId=:u and s.status<>'CONCLUIDO'",Long.class).setParameter("u",Long.valueOf(a.getName())).getSingleResult();
        if(pending>=20) throw new ResponseStatusException(HttpStatus.CONFLICT,"Você já possui 20 solicitações pendentes.");
        var s=new SolicitacaoAtendimentoEntity();s.setEmpresaId(TenantContext.getCurrentTenant());s.setUsuarioId(Long.valueOf(a.getName()));
        s.setCategoria(r.categoria());s.setAssunto(r.assunto().trim());s.setDescricao(r.descricao().trim());s.setStatus("ABERTO");s.setCriadoEm(OffsetDateTime.now());s.setAtualizadoEm(s.getCriadoEm());em.persist(s);
        operation.audit("ABRIR_ATENDIMENTO","solicitacao_atendimento",s.getId(),s.getUsuarioId());return s;
    }
    @PatchMapping("/{id}") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public SolicitacaoAtendimentoEntity update(@PathVariable Long id,@Valid @RequestBody Resposta r,Authentication a) {
        var s=em.find(SolicitacaoAtendimentoEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(s==null||!s.getEmpresaId().equals(TenantContext.getCurrentTenant())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(s.getVersao()!=r.versao())throw new ResponseStatusException(HttpStatus.CONFLICT,"Solicitação alterada. Atualize antes de responder.");
        if(!Set.of("ABERTO","EM_ANALISE","CONCLUIDO").contains(r.status()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        s.setStatus(r.status());s.setResposta(r.resposta().trim());s.setAtualizadoEm(OffsetDateTime.now());
        operation.audit("RESPONDER_ATENDIMENTO","solicitacao_atendimento",s.getId(),Long.valueOf(a.getName()));em.flush();return s;
    }
    public record NovaSolicitacao(@NotBlank String categoria,@NotBlank @Size(max=150) String assunto,@NotBlank @Size(max=4000) String descricao) {}
    public record Resposta(@NotBlank String status,@NotBlank @Size(max=4000) String resposta,@Min(0) long versao) {}
}
