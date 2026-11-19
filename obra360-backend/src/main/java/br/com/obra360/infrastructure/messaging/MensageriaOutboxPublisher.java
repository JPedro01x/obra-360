package br.com.obra360.infrastructure.messaging;

import br.com.obra360.domain.entity.EventoMensagemEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j @Service
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name="obra360.messaging.enabled",havingValue="true")
public class MensageriaOutboxPublisher {
    private final EntityManager em;
    private final Obra360KafkaEventProducer producer;
    @org.springframework.beans.factory.annotation.Value("${obra360.messaging.receipt-timeout-ms:300000}")
    private long receiptTimeoutMs=300000;
    public MensageriaOutboxPublisher(EntityManager em,Obra360KafkaEventProducer producer) {this.em=em;this.producer=producer;}
    @jakarta.annotation.PostConstruct void validateTimeout(){
        if(receiptTimeoutMs<10000||receiptTimeoutMs>86400000)throw new IllegalArgumentException("Prazo de recibo Kafka inválido.");
    }

    @Transactional(readOnly=true)
    public List<String> pendentes() {
        var now=OffsetDateTime.now();
        return em.createQuery("select e.id from EventoMensagemEntity e where e.processadoEm is null and (e.publicadoEm is null or e.publicadoEm<:stale) and e.proximaTentativa<=:agora and not exists (select f.id from FalhaMensageriaEntity f where f.eventoId=e.id and f.resolvidoEm is null) order by e.criadoEm",String.class)
            .setParameter("agora",now).setParameter("stale",now.minusNanos(receiptTimeoutMs*1000000L)).setMaxResults(20).getResultList();
    }

    @Transactional
    public void publicar(String id) {
        var e=em.find(EventoMensagemEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        var now=OffsetDateTime.now();
        if(e==null || e.getProcessadoEm()!=null || e.getProximaTentativa().isAfter(now)
            ||(e.getPublicadoEm()!=null&&!e.getPublicadoEm().isBefore(now.minusNanos(receiptTimeoutMs*1000000L))))return;
        if(em.createQuery("select count(f) from FalhaMensageriaEntity f where f.eventoId=:id and f.resolvidoEm is null",Long.class)
            .setParameter("id",id).getSingleResult()>0)return;
        e.setTentativas(e.getTentativas()+1);
        try {
            producer.publicarEvento(MensageriaKafkaConfig.TOPIC,e.getEmpresaId()+":"+e.getOrdemId(),e.getId());
            e.setPublicadoEm(OffsetDateTime.now());
        } catch(RuntimeException failure) {
            e.setProximaTentativa(OffsetDateTime.now().plusSeconds(Math.min(300,5L*e.getTentativas())));
            log.warn("Kafka indisponível: evento {} permanece pendente (tentativa {}).",e.getId(),e.getTentativas());
        }
    }
}
