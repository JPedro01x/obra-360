package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.util.*;
import java.nio.file.*;
import java.util.concurrent.*;

@Service @org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
public class ExportacaoAsyncService {
 private final EntityManager em;private final TransactionTemplate tx;private final DocumentStorage storage;private final ExportacaoEmpresaService exporter;
 private final ThreadPoolExecutor executor=new ThreadPoolExecutor(1,1,0,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<>(4),r->{var t=new Thread(r,"obra360-exportacao");t.setDaemon(true);return t;});
 public ExportacaoAsyncService(EntityManager em,PlatformTransactionManager manager,DocumentStorage storage,ExportacaoEmpresaService exporter){this.em=em;this.tx=new TransactionTemplate(manager);this.storage=storage;this.exporter=exporter;}
 @EventListener(ApplicationReadyEvent.class) public void recover(){
  tx.executeWithoutResult(status->{for(var j:em.createQuery("select j from ExportacaoJobEntity j where j.situacao in ('FILA','PROCESSANDO')",ExportacaoJobEntity.class).getResultList()){j.setSituacao("FALHA");j.setMensagem("Processo interrompido por reinício. Solicite uma nova exportação.");remove(j.getId());}});
 }
 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=1800000,initialDelay=1800000)
 public void purgeExpired(){tx.executeWithoutResult(s->{
  for(var j:em.createQuery("select j from ExportacaoJobEntity j where j.expiraEm<:now and j.situacao in ('PRONTO','FALHA','PENDENTE_LIMPEZA')",ExportacaoJobEntity.class).setParameter("now",OffsetDateTime.now()).setMaxResults(100).getResultList()){
   j.setSituacao(remove(j.getId())?"EXPIRADO":"PENDENTE_LIMPEZA");j.setMensagem("Arquivo temporário expirado.");
  }
 });}
 private boolean remove(String id){try{Files.deleteIfExists(storage.exportPath(id));return true;}catch(Exception ignored){return false;}}
 public synchronized ExportacaoJobEntity start(Long company,Long actor){
  var j=tx.execute(status->{
   long active=em.createQuery("select count(j) from ExportacaoJobEntity j where j.empresaId=:t and j.situacao in ('FILA','PROCESSANDO')",Long.class).setParameter("t",company).getSingleResult();
   if(active>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Já existe uma exportação em andamento para a empresa.");
   var job=new ExportacaoJobEntity();job.setId(UUID.randomUUID().toString());job.setEmpresaId(company);job.setUsuarioId(actor);job.setCriadoEm(OffsetDateTime.now());job.setExpiraEm(OffsetDateTime.now().plusHours(24));job.setSituacao("FILA");job.setMensagem("Aguardando processamento.");em.persist(job);
   em.persist(LogAuditoriaEntity.builder().empresaId(company).usuarioId(actor).acao("SOLICITAR_EXPORTACAO").entidadeAfetada("empresa").entidadeId(company).build());return job;
  });
  try{executor.execute(()->run(j.getId()));}catch(RejectedExecutionException e){update(j.getId(),"FALHA","Fila ocupada. Tente novamente mais tarde.",0);throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Fila de exportação ocupada.");}return j;
 }
 private void update(String id,String state,String message,long size){tx.executeWithoutResult(s->{var j=em.find(ExportacaoJobEntity.class,id);if(j!=null){j.setSituacao(state);j.setMensagem(message);j.setTamanho(size);}});}
 private void run(String id){
  var job=tx.execute(s->em.find(ExportacaoJobEntity.class,id));if(job==null)return;
  update(id,"PROCESSANDO","Gerando arquivo privado.",0);
  try(var reservation=storage.reserveExport()){
   Path file=storage.exportPath(id);exporter.exportTo(job.getEmpresaId(),file);update(id,"PRONTO","Disponível por 24 horas a partir da solicitação.",Files.size(file));
  }catch(Exception e){remove(id);update(id,"FALHA","Exportação não concluída. Confira integridade, espaço e limites (250 MB e 100 mil registros).",0);}
 }
 public List<ExportacaoJobEntity> list(){Long company=TenantContext.getCurrentTenant();return tx.execute(s->{
  for(var j:em.createQuery("select j from ExportacaoJobEntity j where j.empresaId=:t and j.expiraEm<:now and j.situacao<>'EXPIRADO'",ExportacaoJobEntity.class).setParameter("t",company).setParameter("now",OffsetDateTime.now()).setMaxResults(100).getResultList()){
   if(Set.of("FILA","PROCESSANDO").contains(j.getSituacao()))continue;j.setSituacao(remove(j.getId())?"EXPIRADO":"PENDENTE_LIMPEZA");j.setMensagem("Prazo encerrado. Solicite nova exportação.");
  }
  return em.createQuery("select j from ExportacaoJobEntity j where j.empresaId=:t order by j.criadoEm desc",ExportacaoJobEntity.class).setParameter("t",company).setMaxResults(20).getResultList();
 });}
 public Path download(String id,Long company,Long actor){
  if(!id.matches("[0-9a-f-]{36}"))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  return tx.execute(s->{var j=em.find(ExportacaoJobEntity.class,id);if(j==null||!company.equals(j.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
   if(!j.getSituacao().equals("PRONTO")||j.getExpiraEm().isBefore(OffsetDateTime.now()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Exportação indisponível ou expirada.");
   try{var file=storage.exportPath(id);if(!Files.isRegularFile(file))throw new ResponseStatusException(HttpStatus.NOT_FOUND);em.persist(LogAuditoriaEntity.builder().empresaId(company).usuarioId(actor).acao("BAIXAR_EXPORTACAO").entidadeAfetada("empresa").entidadeId(company).build());return file;}catch(java.io.IOException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Arquivo indisponível.");}
  });
 }
 @PreDestroy public void stop(){executor.shutdownNow();try{executor.awaitTermination(5,TimeUnit.SECONDS);}catch(InterruptedException e){Thread.currentThread().interrupt();}}
}
