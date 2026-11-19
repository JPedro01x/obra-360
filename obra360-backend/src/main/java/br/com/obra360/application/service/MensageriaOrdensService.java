package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class MensageriaOrdensService {
    private final EntityManager em;
    public MensageriaOrdensService(EntityManager em) { this.em=em; }

    @Transactional(propagation=org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void registrar(Long empresa,Long destinatario,SolicitacaoServicoEntity ordem) {
        var e=new EventoMensagemEntity();
        e.setId(UUID.randomUUID().toString());e.setEmpresaId(empresa);e.setUsuarioId(destinatario);
        e.setOrdemId(ordem.getId());e.setProtocolo(ordem.getCodigoProtocolo());
        e.setCriadoEm(OffsetDateTime.now());e.setProximaTentativa(e.getCriadoEm());em.persist(e);
    }

    /** Tenant comes from the committed outbox, never from a Kafka header or ThreadLocal. */
    @Transactional
    public void processar(String id) {
        if(id==null || !id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            throw new IllegalArgumentException("Identificador de evento inválido.");
        var e=em.find(EventoMensagemEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(e==null || e.getProcessadoEm()!=null) return;
        var user=em.find(UsuarioEntity.class,e.getUsuarioId());
        // Removed/inactive recipients must not receive notifications or block the partition.
        if(user!=null && e.getEmpresaId().equals(user.getEmpresaId()) && Boolean.TRUE.equals(user.getAtivo())) {
            var n=new NotificacaoEntity();n.setEmpresaId(e.getEmpresaId());n.setUsuarioId(user.getId());
            n.setMensagem("Nova ordem de serviço "+e.getProtocolo()+" atribuída à sua equipe.");
            n.setCriadoEm(OffsetDateTime.now());em.persist(n);
        }
        // Receipt and notification commit atomically: re-delivery cannot duplicate the notification.
        e.setProcessadoEm(OffsetDateTime.now());
    }
}
