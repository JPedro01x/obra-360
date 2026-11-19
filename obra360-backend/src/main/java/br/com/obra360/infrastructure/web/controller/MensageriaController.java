package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/v1/workspace/mensageria")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','AUDITOR')")
public class MensageriaController {
    private final EntityManager em;
    private final boolean enabled;
    private final br.com.obra360.application.service.MensageriaFalhasService failures;
    public MensageriaController(EntityManager em,@Value("${obra360.messaging.enabled:false}") boolean enabled,
        br.com.obra360.application.service.MensageriaFalhasService failures){this.em=em;this.enabled=enabled;this.failures=failures;}
    @GetMapping @Transactional(readOnly=true)
    public Map<String,Object> status(){
        Long tenant=TenantContext.getCurrentTenant();
        long failed=em.createQuery("select count(f) from FalhaMensageriaEntity f where f.empresaId=:t and f.resolvidoEm is null",Long.class).setParameter("t",tenant).getSingleResult();
        long delayed=em.createQuery("select count(e) from EventoMensagemEntity e where e.empresaId=:t and e.processadoEm is null and e.criadoEm<:cut",Long.class)
            .setParameter("t",tenant).setParameter("cut",java.time.OffsetDateTime.now().minusMinutes(5)).getSingleResult();
        long pending=count("publicadoEm is null and e.processadoEm is null"),awaiting=count("publicadoEm is not null and e.processadoEm is null");
        return Map.of("habilitada",enabled,"pendentesPublicacao",pending,"aguardandoProcessamento",awaiting,
            "processados",count("processadoEm is not null"),"falhasConsumo",failed,"atrasados",delayed,
            "requerAtencao",failed>0||delayed>0||(!enabled&&(pending+awaiting)>0));
    }
    @GetMapping("/falhas")
    public Map<String,Object> failures(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="25") int size){return failures.listar(page,size);}
    @PostMapping("/falhas/{id}/reprocessar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA')")
    public Map<String,Object> replay(@PathVariable String id,org.springframework.security.core.Authentication actor){
        if(id==null||!id.matches("[0-9a-f-]{36}"))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND);
        return failures.reprocessar(id,Long.valueOf(actor.getName()));
    }
    private long count(String condition){return em.createQuery("select count(e) from EventoMensagemEntity e where e.empresaId=:t and e."+condition,Long.class)
        .setParameter("t",TenantContext.getCurrentTenant()).getSingleResult();}
}
