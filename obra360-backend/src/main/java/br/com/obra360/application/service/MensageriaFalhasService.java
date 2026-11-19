package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;

/** Durable consumer recovery. A failed transaction must propagate to Kafka. */
@Service
public class MensageriaFalhasService {
    private final EntityManager em;
    private final MensageriaOrdensService consumer;
    private final OperacaoService operations;
    public MensageriaFalhasService(EntityManager em,MensageriaOrdensService consumer,OperacaoService operations) {
        this.em=em;this.consumer=consumer;this.operations=operations;
    }

    @Transactional
    public void registrar(ConsumerRecord<?,?> record,Exception exception) {
        String value=Objects.toString(record.value(),"");
        String hash;
        try {hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException impossible){throw new IllegalStateException(impossible);}
        String id=UUID.nameUUIDFromBytes((record.topic()+":"+record.partition()+":"+record.offset()+":"+hash)
            .getBytes(StandardCharsets.UTF_8)).toString();
        if(em.find(FalhaMensageriaEntity.class,id)!=null)return;
        var failure=new FalhaMensageriaEntity();failure.setId(id);
        failure.setTopico(record.topic());failure.setParticao(record.partition());failure.setDeslocamento(record.offset());
        failure.setHashConteudo(hash);failure.setCriadoEm(OffsetDateTime.now());
        Throwable cause=exception;for(int n=0;n<8&&cause.getCause()!=null&&cause.getCause()!=cause;n++)cause=cause.getCause();
        String kind=cause.getClass().getSimpleName();failure.setTipoErro(kind.substring(0,Math.min(160,kind.length())));
        if(value.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            var event=em.find(EventoMensagemEntity.class,value,LockModeType.PESSIMISTIC_WRITE);
            if(event!=null){failure.setEventoId(event.getId());failure.setEmpresaId(event.getEmpresaId());}
        }
        em.persist(failure);em.flush();
        // Only the opaque failure ID is logged, never payload, keys, personal data or exception text.
        org.slf4j.LoggerFactory.getLogger(getClass()).warn("Evento Kafka colocado em quarentena: {}.",id);
    }

    @Transactional(readOnly=true)
    public Map<String,Object> listar(int page,int size) {
        if(page<0||page>100000||size<1||size>100)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Página inválida.");
        Long tenant=TenantContext.getCurrentTenant();
        var items=em.createQuery("select f from FalhaMensageriaEntity f where f.empresaId=:t order by f.criadoEm desc,f.id desc",FalhaMensageriaEntity.class)
            .setParameter("t",tenant).setFirstResult(page*size).setMaxResults(size).getResultList();
        long total=em.createQuery("select count(f) from FalhaMensageriaEntity f where f.empresaId=:t",Long.class).setParameter("t",tenant).getSingleResult();
        return Map.of("items",items,"total",total,"page",page,"size",size);
    }

    @Transactional
    public Map<String,Object> reprocessar(String id,Long actor) {
        var failure=em.find(FalhaMensageriaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(failure==null||!Objects.equals(failure.getEmpresaId(),TenantContext.getCurrentTenant()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(failure.getResolvidoEm()!=null)return Map.of("resolvido",true);
        var event=failure.getEventoId()==null?null:em.find(EventoMensagemEntity.class,failure.getEventoId());
        if(event==null||!failure.getEmpresaId().equals(event.getEmpresaId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Evento original indisponível para reprocessamento.");
        var user=em.find(UsuarioEntity.class,actor);
        if(user==null||!failure.getEmpresaId().equals(user.getEmpresaId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        consumer.processar(event.getId());
        failure.setResolvidoEm(OffsetDateTime.now());failure.setOperadorId(actor);
        operations.audit("REPROCESSAR_MENSAGERIA","falha_mensageria",event.getOrdemId(),actor);
        return Map.of("resolvido",true);
    }
}
