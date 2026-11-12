package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.domain.entity.NotificacaoEntity;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.Map;

@RestController @RequestMapping("/api/v1/workspace/notificacoes") @PreAuthorize("isAuthenticated()")
public class NotificacoesController {
    private final EntityManager em;
    public NotificacoesController(EntityManager em) {this.em=em;}
    @GetMapping @Transactional(readOnly=true)
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,Authentication auth) {
        if(page<0 || page>100000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        Long tenant=TenantContext.getCurrentTenant(),user=Long.valueOf(auth.getName());
        String where=" from NotificacaoEntity n where n.empresaId=:t and n.usuarioId=:u";
        return Map.of("items",em.createQuery("select n"+where+" order by n.id desc",NotificacaoEntity.class).setParameter("t",tenant).setParameter("u",user).setFirstResult(page*25).setMaxResults(25).getResultList(),
            "naoLidas",em.createQuery("select count(n)"+where+" and n.lidoEm is null",Long.class).setParameter("t",tenant).setParameter("u",user).getSingleResult(),
            "total",em.createQuery("select count(n)"+where,Long.class).setParameter("t",tenant).setParameter("u",user).getSingleResult());
    }
    @PostMapping("/{id}/ler") @Transactional @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable Long id,Authentication auth) {
        var n=em.find(NotificacaoEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(n==null || !n.getEmpresaId().equals(TenantContext.getCurrentTenant()) || !n.getUsuarioId().equals(Long.valueOf(auth.getName()))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(n.getLidoEm()==null) n.setLidoEm(OffsetDateTime.now());
    }
}
