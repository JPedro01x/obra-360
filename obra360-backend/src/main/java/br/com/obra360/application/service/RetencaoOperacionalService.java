package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.*;
@Service
public class RetencaoOperacionalService {
 private final EntityManager em;
 public RetencaoOperacionalService(EntityManager em){this.em=em;}
 @Transactional public Map<String,Object> clean(Long company,int days,boolean apply){
  if(company==null||days<30||days>3650)throw new IllegalArgumentException("Informe empresa e retenção entre 30 e 3650 dias.");
  if(em.find(EmpresaEntity.class,company)==null)throw new IllegalArgumentException("Empresa não encontrada.");
  var cutoff=OffsetDateTime.now().minusDays(days);var counts=new LinkedHashMap<String,Object>();
  for(String type:List.of("SessaoEntity","ConviteEntity","PasswordResetEntity")){
   String id=type.equals("PasswordResetEntity")?"tokenHash":"id";
   String scope=type.equals("ConviteEntity")?"e.empresaId=:t":"e.usuarioId in (select u.id from UsuarioEntity u where u.empresaId=:t)";
   var ids=em.createQuery("select e."+id+" from "+type+" e where "+scope+" and e.expiraEm<:cut order by e.expiraEm",String.class).setParameter("t",company).setParameter("cut",cutoff).setMaxResults(1000).getResultList();
   int count=apply&&!ids.isEmpty()?em.createQuery("delete from "+type+" e where e."+id+" in :ids").setParameter("ids",ids).executeUpdate():ids.size();counts.put(type,count);
  }
  if(apply)em.persist(LogAuditoriaEntity.builder().empresaId(company).acao("RETENCAO_OPERACIONAL").entidadeAfetada("empresa").entidadeId(company).detalhesJson("{\"dias\":"+days+",\"limitePorTipo\":1000}").build());
  counts.put("aplicado",apply);counts.put("diasRetencao",days);counts.put("limitePorTipo",1000);return counts;
 }

 /** Explicit operator action, separate from credential cleanup; dry-run unless apply=true. */
 @Transactional public Map<String,Object> cleanMessaging(Long company,int days,boolean apply){
  if(company==null||days<30||days>3650)throw new IllegalArgumentException("Informe empresa e retenção entre 30 e 3650 dias.");
  if(em.find(EmpresaEntity.class,company)==null)throw new IllegalArgumentException("Empresa não encontrada.");
  var cutoff=OffsetDateTime.now().minusDays(days);
  var failures=em.createQuery("select f.id from FalhaMensageriaEntity f where f.empresaId=:t and f.resolvidoEm<:cut order by f.resolvidoEm,f.id",String.class)
   .setParameter("t",company).setParameter("cut",cutoff).setMaxResults(1000).getResultList();
  int failureCount=apply&&!failures.isEmpty()?em.createQuery("delete from FalhaMensageriaEntity f where f.id in :ids").setParameter("ids",failures).executeUpdate():failures.size();
  var query=em.createQuery("select e from EventoMensagemEntity e where e.empresaId=:t and e.processadoEm<:cut and not exists (select f.id from FalhaMensageriaEntity f where f.eventoId=e.id and f.resolvidoEm is null) order by e.processadoEm,e.id",EventoMensagemEntity.class)
   .setParameter("t",company).setParameter("cut",cutoff).setMaxResults(1000);
  if(apply)query.setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
  var events=query.getResultList();int eventCount=events.size();
  if(apply){
   eventCount=0;
   for(var event:events){
    // A recorder may have committed a failure while this selection waited for its event lock.
    long unresolved=em.createQuery("select count(f) from FalhaMensageriaEntity f where f.eventoId=:id and f.resolvidoEm is null",Long.class)
     .setParameter("id",event.getId()).getSingleResult();
    if(unresolved==0){em.remove(event);eventCount++;}
   }
   em.persist(LogAuditoriaEntity.builder().empresaId(company).acao("RETENCAO_MENSAGERIA").entidadeAfetada("empresa").entidadeId(company)
    .detalhesJson("{\"dias\":"+days+",\"limitePorTipo\":1000}").build());
  }
  return Map.of("eventosProcessados",eventCount,"falhasResolvidas",failureCount,"aplicado",apply,"diasRetencao",days,"limitePorTipo",1000);
 }
}
