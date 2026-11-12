package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;

@Service @Transactional
public class NotificacaoService {
    private final EntityManager em;
    public NotificacaoService(EntityManager em) {this.em=em;}
    public void send(Long recipient,String message) {
        var user=em.find(UsuarioEntity.class,recipient);
        if(user==null || !TenantContext.getCurrentTenant().equals(user.getEmpresaId()) || !Boolean.TRUE.equals(user.getAtivo())) return;
        var notification=new NotificacaoEntity();notification.setEmpresaId(user.getEmpresaId());notification.setUsuarioId(recipient);
        notification.setMensagem(message.substring(0,Math.min(500,message.length())));notification.setCriadoEm(OffsetDateTime.now());em.persist(notification);
    }
}
