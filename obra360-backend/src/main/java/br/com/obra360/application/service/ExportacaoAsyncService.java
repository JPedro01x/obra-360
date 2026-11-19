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
import java.nio.channels.*;
import java.io.IOException;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service @org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
public class ExportacaoAsyncService {
 private static final int MAX_ATTEMPTS=3;
 private final EntityManager em;private final TransactionTemplate tx;private final DocumentStorage storage;private final ExportacaoEmpresaService exporter;
 private final ExecutorService executor=Executors.newSingleThreadExecutor(r->{var t=new Thread(r,"obra360-exportacao");t.setDaemon(true);return t;});
 private final AtomicBoolean running=new AtomicBoolean();
 private volatile boolean ready,stopping;
 private FileChannel lockChannel;private FileLock writerLock;
 public ExportacaoAsyncService(EntityManager em,PlatformTransactionManager manager,DocumentStorage storage,ExportacaoEmpresaService exporter){this.em=em;this.tx=new TransactionTemplate(manager);this.storage=storage;this.exporter=exporter;}

 /** Local installation contract: one writer for this directory, including restart recovery. */
 @EventListener(ApplicationReadyEvent.class) public synchronized void recover(){
  if(ready)return;
  try{
   Path directory=storage.exportPath(UUID.randomUUID().toString()).getParent();
   lockChannel=FileChannel.open(directory.resolve(".worker.lock"),StandardOpenOption.CREATE,StandardOpenOption.WRITE);
   writerLock=lockChannel.tryLock();
   if(writerLock==null)throw new IllegalStateException("Diretório de exportação já possui um escritor ativo.");
   tx.executeWithoutResult(status->{for(var j:em.createQuery("select j from ExportacaoJobEntity j where j.situacao in ('FILA','PROCESSANDO')",ExportacaoJobEntity.class).getResultList())restore(j);});
   // A crash before the initial transaction committed can leave an unreferenced partial file.
   try(var files=Files.list(directory)){for(Path file:files.filter(p->p.getFileName().toString().matches("[0-9a-f-]{36}\\.zip\\.part")).toList())Files.deleteIfExists(file);}
   ready=true;
  }catch(Exception failure){releaseLock();throw new IllegalStateException("Não foi possível assumir o diretório privado de exportações.",failure);}
 }

 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=2000,initialDelay=2000)
 public void dispatch(){
  if(!ready||stopping||!running.compareAndSet(false,true))return;
  try{executor.execute(()->{try{processNext();}catch(Exception ignored){/* Database failure leaves durable work for the next poll/restart. */}finally{running.set(false);if(stopping)releaseLock();}});}
  catch(RejectedExecutionException ignored){running.set(false);}
 }

 private void restore(ExportacaoJobEntity j){
  if(!remove(j.getId()))throw new IllegalStateException("Não foi possível limpar exportação interrompida.");
  if(j.getExpiraEm().isBefore(OffsetDateTime.now())){j.setSituacao("EXPIRADO");j.setMensagem("Arquivo temporário expirado.");}
  else if(j.getTentativas()>=MAX_ATTEMPTS){j.setSituacao("FALHA");j.setMensagem("Limite de tentativas atingido. Solicite nova exportação.");}
  else {j.setSituacao("FILA");j.setMensagem("Aguardando retomada do processamento.");}
 }

 private void processNext(){
  var job=tx.execute(s->{
   // Only this single worker can run under the directory lock. A PROCESSANDO row here
   // belongs to its previous failed transaction, never to another active worker.
   for(var abandoned:em.createQuery("select j from ExportacaoJobEntity j where j.situacao='PROCESSANDO'",ExportacaoJobEntity.class).getResultList())restore(abandoned);
   var now=OffsetDateTime.now();
   var jobs=em.createQuery("select j from ExportacaoJobEntity j where j.situacao='FILA' and (j.proximaTentativaEm is null or j.proximaTentativaEm<=:now) order by j.criadoEm,j.id",ExportacaoJobEntity.class).setParameter("now",now).setMaxResults(1).getResultList();
   if(jobs.isEmpty())return null;
   var j=jobs.getFirst();
   if(j.getExpiraEm().isBefore(now)){j.setSituacao(remove(j.getId())?"EXPIRADO":"PENDENTE_LIMPEZA");j.setMensagem("Arquivo temporário expirado.");return null;}
   if(j.getTentativas()>=MAX_ATTEMPTS){j.setSituacao("FALHA");j.setMensagem("Limite de tentativas atingido. Solicite nova exportação.");return null;}
   j.setTentativas(j.getTentativas()+1);j.setSituacao("PROCESSANDO");j.setProximaTentativaEm(null);j.setMensagem("Gerando arquivo privado.");return j;
  });
  if(job==null)return;
  try(var reservation=storage.reserveExport()){
   Path file=storage.exportPath(job.getId()),partial=partial(file);
   if(!remove(job.getId()))throw new IOException("Falha na limpeza privada.");
   Long previousTenant=TenantContext.getCurrentTenant();
   try{
    TenantContext.setCurrentTenant(job.getEmpresaId());
    exporter.exportTo(job.getEmpresaId(),partial);
   }finally{
    if(previousTenant==null)TenantContext.clear();else TenantContext.setCurrentTenant(previousTenant);
   }
   if(stopping||Thread.currentThread().isInterrupted())throw new IOException("Processamento interrompido.");
   if(job.getExpiraEm().isBefore(OffsetDateTime.now()))throw new IOException("Prazo encerrado.");
   Files.move(partial,file,StandardCopyOption.ATOMIC_MOVE);
   long size=Files.size(file);
   tx.executeWithoutResult(s->{var j=em.find(ExportacaoJobEntity.class,job.getId());j.setSituacao("PRONTO");j.setMensagem("Disponível por 24 horas a partir da solicitação.");j.setTamanho(size);});
  }catch(Exception failure){
   boolean removed=remove(job.getId());
   tx.executeWithoutResult(s->{var j=em.find(ExportacaoJobEntity.class,job.getId());
    if(!removed){j.setSituacao("PENDENTE_LIMPEZA");j.setExpiraEm(OffsetDateTime.now());}
    else if(j.getExpiraEm().isBefore(OffsetDateTime.now()))j.setSituacao("EXPIRADO");
    else if(j.getTentativas()>=MAX_ATTEMPTS)j.setSituacao("FALHA");
    else {j.setSituacao("FILA");j.setProximaTentativaEm(OffsetDateTime.now().plusSeconds(30));}
    j.setMensagem("Exportação não concluída. Tentativas limitadas; confira espaço e limites (250 MB e 100 mil registros).");j.setTamanho(0);
   });
  }
 }

 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=1800000,initialDelay=1800000)
 public void purgeExpired(){if(!ready||stopping)return;tx.executeWithoutResult(s->{
  for(var j:em.createQuery("select j from ExportacaoJobEntity j where j.expiraEm<:now and j.situacao in ('PRONTO','FALHA','PENDENTE_LIMPEZA')",ExportacaoJobEntity.class).setParameter("now",OffsetDateTime.now()).setMaxResults(100).getResultList()){
   j.setSituacao(remove(j.getId())?"EXPIRADO":"PENDENTE_LIMPEZA");j.setMensagem("Arquivo temporário expirado.");
  }
 });}
 private static Path partial(Path file){return file.resolveSibling(file.getFileName()+".part");}
 private boolean remove(String id){try{Path file=storage.exportPath(id);Files.deleteIfExists(partial(file));Files.deleteIfExists(file);return true;}catch(Exception ignored){return false;}}
 public synchronized ExportacaoJobEntity start(Long company,Long actor){
  if(!ready||stopping)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Fila privada indisponível.");
  var job=tx.execute(status->{
   long active=em.createQuery("select count(j) from ExportacaoJobEntity j where j.empresaId=:t and j.situacao in ('FILA','PROCESSANDO')",Long.class).setParameter("t",company).getSingleResult();
   if(active>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Já existe uma exportação em andamento para a empresa.");
   var j=new ExportacaoJobEntity();j.setId(UUID.randomUUID().toString());j.setEmpresaId(company);j.setUsuarioId(actor);j.setCriadoEm(OffsetDateTime.now());j.setExpiraEm(OffsetDateTime.now().plusHours(24));j.setSituacao("FILA");j.setMensagem("Aguardando processamento.");em.persist(j);
   em.persist(LogAuditoriaEntity.builder().empresaId(company).usuarioId(actor).acao("SOLICITAR_EXPORTACAO").entidadeAfetada("empresa").entidadeId(company).build());return j;
  });
  dispatch();return job;
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
   try{var file=storage.exportPath(id);if(!Files.isRegularFile(file))throw new ResponseStatusException(HttpStatus.NOT_FOUND);em.persist(LogAuditoriaEntity.builder().empresaId(company).usuarioId(actor).acao("BAIXAR_EXPORTACAO").entidadeAfetada("empresa").entidadeId(company).build());return file;}catch(IOException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Arquivo indisponível.");}
  });
 }
 private synchronized void releaseLock(){try{if(writerLock!=null)writerLock.release();}catch(IOException ignored){}try{if(lockChannel!=null)lockChannel.close();}catch(IOException ignored){}writerLock=null;lockChannel=null;ready=false;}
 @PreDestroy public void stop(){stopping=true;executor.shutdownNow();try{if(executor.awaitTermination(5,TimeUnit.SECONDS))releaseLock();}catch(InterruptedException e){Thread.currentThread().interrupt();}}
}
