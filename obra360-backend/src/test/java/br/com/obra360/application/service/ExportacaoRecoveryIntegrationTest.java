package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.zip.ZipFile;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:export_recovery;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate","DOCUMENT_STORAGE=local","DOCUMENT_STORAGE_TENANT_MAX_BYTES=1048576","obra360.storage.directory=${java.io.tmpdir}/obra360-export-recovery-${random.uuid}"})
@ActiveProfiles("dev")
class ExportacaoRecoveryIntegrationTest {
 @Autowired EntityManager em;@Autowired PlatformTransactionManager manager;@Autowired DocumentStorage storage;
 @Autowired ExportacaoEmpresaService exporter;@Autowired ExportacaoAsyncService applicationWorker;
 TransactionTemplate tx(){return new TransactionTemplate(manager);}
 ExportacaoJobEntity persisted(String state,int attempts,OffsetDateTime expiry){return tx().execute(s->{
  String key=UUID.randomUUID().toString();var c=EmpresaEntity.builder().cnpj(key.substring(0,14)).razaoSocial("Exportação recuperável").nomeFantasia("Teste").build();em.persist(c);
  var u=UsuarioEntity.builder().empresaId(c.getId()).email(key+"@test.invalid").nome("Operador").perfil("SUPER_ADMIN").ativo(true).senhaHash("segredo-nao-exportavel").build();em.persist(u);
  var j=new ExportacaoJobEntity();j.setId(key);j.setEmpresaId(c.getId());j.setUsuarioId(u.getId());j.setSituacao(state);j.setTentativas(attempts);j.setCriadoEm(OffsetDateTime.now());j.setExpiraEm(expiry);j.setMensagem("Teste");em.persist(j);return j;
 });}
 ExportacaoJobEntity read(String id){return tx().execute(s->em.find(ExportacaoJobEntity.class,id));}
 void awaitState(String id,String expected)throws Exception{long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(15);while(System.nanoTime()<end){if(expected.equals(read(id).getSituacao()))return;Thread.sleep(25);}assertEquals(expected,read(id).getSituacao());}
 @Test void durableRestartAtomicPublicationBoundedRetriesAndTenantIsolation() throws Exception {
  applicationWorker.stop();
  var queued=persisted("FILA",0,OffsetDateTime.now().plusHours(24));
  var crashed=persisted("PROCESSANDO",1,OffsetDateTime.now().plusHours(24));
  var exhausted=persisted("PROCESSANDO",3,OffsetDateTime.now().plusHours(24));
  var expired=persisted("FILA",0,OffsetDateTime.now().minusSeconds(1));
  Path crashedFile=storage.exportPath(crashed.getId());Path partial=crashedFile.resolveSibling(crashedFile.getFileName()+".part");Files.writeString(partial,"incomplete");Files.writeString(crashedFile,"unpublished");
  var blocking=mock(ExportacaoEmpresaService.class);var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
  doAnswer(inv->{entered.countDown();assertTrue(release.await(10,TimeUnit.SECONDS));exporter.exportTo(inv.getArgument(0),inv.getArgument(1));return null;}).when(blocking).exportTo(anyLong(),any(Path.class));
  var first=new ExportacaoAsyncService(em,manager,storage,blocking);
  try{
   first.recover();assertEquals("FILA",read(queued.getId()).getSituacao());assertEquals("FILA",read(crashed.getId()).getSituacao());assertEquals("FALHA",read(exhausted.getId()).getSituacao());assertEquals("EXPIRADO",read(expired.getId()).getSituacao());assertFalse(Files.exists(partial));assertFalse(Files.exists(crashedFile));
   first.dispatch();assertTrue(entered.await(10,TimeUnit.SECONDS));
   assertThrows(ResponseStatusException.class,()->first.start(queued.getEmpresaId(),queued.getUsuarioId()));
   for(int n=0;n<10;n++)first.dispatch();
   var contender=new ExportacaoAsyncService(em,manager,storage,exporter);try{assertThrows(IllegalStateException.class,contender::recover);assertEquals("PROCESSANDO",read(queued.getId()).getSituacao());}finally{contender.stop();}
   assertFalse(Files.exists(storage.exportPath(queued.getId())));release.countDown();awaitState(queued.getId(),"PRONTO");
   assertEquals(1,read(queued.getId()).getTentativas());
   Path ready=first.download(queued.getId(),queued.getEmpresaId(),queued.getUsuarioId());
   try(var zip=new ZipFile(ready.toFile())){var entry=zip.stream().filter(e->e.getName().startsWith("registros/UsuarioEntity/")).findFirst().orElseThrow();String user=new String(zip.getInputStream(entry).readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);assertFalse(user.contains("senhaHash"));assertFalse(user.contains("segredo-nao-exportavel"));}
   assertEquals(404,assertThrows(ResponseStatusException.class,()->first.download(queued.getId(),crashed.getEmpresaId(),crashed.getUsuarioId())).getStatusCode().value());
  }finally{release.countDown();first.stop();}
  // A new service in the same installation resumes the still-queued crashed job.
  var failing=mock(ExportacaoEmpresaService.class);doThrow(new IOException("private detail must not escape")).when(failing).exportTo(anyLong(),any(Path.class));
  var second=new ExportacaoAsyncService(em,manager,storage,failing);
  try{second.recover();second.dispatch();awaitState(crashed.getId(),"FILA");
   // Await the committed attempt, rather than mistaking the initial FILA for retry completion.
   long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);while(read(crashed.getId()).getTentativas()<2&&System.nanoTime()<end)Thread.sleep(25);
   awaitState(crashed.getId(),"FILA");assertEquals(2,read(crashed.getId()).getTentativas());assertNotNull(read(crashed.getId()).getProximaTentativaEm());
   tx().executeWithoutResult(s->em.find(ExportacaoJobEntity.class,crashed.getId()).setProximaTentativaEm(OffsetDateTime.now().minusSeconds(1)));second.dispatch();awaitState(crashed.getId(),"FALHA");assertEquals(3,read(crashed.getId()).getTentativas());assertFalse(read(crashed.getId()).getMensagem().contains("private detail"));assertFalse(Files.exists(crashedFile));assertFalse(Files.exists(partial));
   tx().executeWithoutResult(s->em.find(ExportacaoJobEntity.class,queued.getId()).setExpiraEm(OffsetDateTime.now().minusSeconds(1)));second.purgeExpired();assertFalse(Files.exists(storage.exportPath(queued.getId())));
  }finally{second.stop();}
 }
 @Test void failedDatabaseStatusWriteIsRecoveredWithoutRestart() throws Exception {
  applicationWorker.stop();
  var job=persisted("FILA",0,OffsetDateTime.now().plusHours(24));
  var failures=new java.util.concurrent.atomic.AtomicInteger();
  PlatformTransactionManager flaky=new PlatformTransactionManager(){
   public org.springframework.transaction.TransactionStatus getTransaction(org.springframework.transaction.TransactionDefinition definition){if(failures.getAndUpdate(n->Math.max(0,n-1))>0)throw new org.springframework.transaction.CannotCreateTransactionException("simulated outage");return manager.getTransaction(definition);}
   public void commit(org.springframework.transaction.TransactionStatus status){manager.commit(status);}
   public void rollback(org.springframework.transaction.TransactionStatus status){manager.rollback(status);}
  };
  var calls=new java.util.concurrent.atomic.AtomicInteger();var adapter=mock(ExportacaoEmpresaService.class);
  doAnswer(inv->{exporter.exportTo(inv.getArgument(0),inv.getArgument(1));if(calls.incrementAndGet()==1)failures.set(2);return null;}).when(adapter).exportTo(anyLong(),any(Path.class));
  var worker=new ExportacaoAsyncService(em,flaky,storage,adapter);
  try{worker.recover();worker.dispatch();long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(15);
   while(System.nanoTime()<end){Thread.sleep(25);worker.dispatch();if("PRONTO".equals(read(job.getId()).getSituacao()))break;}
   assertEquals("PRONTO",read(job.getId()).getSituacao());assertEquals(2,read(job.getId()).getTentativas());assertEquals(2,calls.get());
  }finally{worker.stop();}
 }
 private Long attachDocument(ExportacaoJobEntity job,String reference,byte[] content){return tx().execute(s->{
  var project=ProjetoObraEntity.builder().empresaId(job.getEmpresaId()).engenheiroResponsavelId(job.getUsuarioId()).nome("Arquivo com quota").vgvEstimado(java.math.BigDecimal.ZERO).areaTotalM2(java.math.BigDecimal.ONE).dataInicio(LocalDate.now()).dataPrevisaoFim(LocalDate.now().plusDays(1)).build();em.persist(project);
  String hash;try{hash=java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(content));}catch(Exception ex){throw new RuntimeException(ex);}
  var document=DocumentoProjetoEntity.builder().projetoObraId(project.getId()).titulo("Documento privado").tipoDocumento("MEMORIAL_PDF").nomeArquivo("documento.pdf").urlArmazenamento(reference).hashArquivoSha256(hash).build();em.persist(document);return document.getId();
 });}
 private void dispatchUntil(ExportacaoAsyncService worker,String id,String expected)throws Exception{long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(15);while(System.nanoTime()<end){worker.dispatch();if(expected.equals(read(id).getSituacao()))return;Thread.sleep(25);}assertEquals(expected,read(id).getSituacao());}
 @Test void quotaTrackedFilesUseJobTenantAndWorkerContextNeverLeaksAcrossCompanies() throws Exception {
  applicationWorker.stop();
  var own=persisted("FILA",0,OffsetDateTime.now().plusHours(24));var other=persisted("FILA",0,OffsetDateTime.now().plusHours(24));var forged=persisted("FILA",2,OffsetDateTime.now().plusHours(24));
  byte[] ownBytes="private company A document".getBytes(java.nio.charset.StandardCharsets.UTF_8),otherBytes="private company B document".getBytes(java.nio.charset.StandardCharsets.UTF_8);
  var worker=new ExportacaoAsyncService(em,manager,storage,exporter);
  try{
   br.com.obra360.infrastructure.security.TenantContext.setCurrentTenant(own.getEmpresaId());String ownRef=storage.put(ownBytes);Long ownDocument=attachDocument(own,ownRef,ownBytes);
   br.com.obra360.infrastructure.security.TenantContext.setCurrentTenant(other.getEmpresaId());String otherRef=storage.put(otherBytes);Long otherDocument=attachDocument(other,otherRef,otherBytes);
   assertThrows(ResponseStatusException.class,()->storage.read(ownRef));attachDocument(forged,ownRef,ownBytes);
   // The request thread's tenant is deliberately unrelated to all queued jobs.
   br.com.obra360.infrastructure.security.TenantContext.setCurrentTenant(999999L);worker.recover();
   var thread=(java.util.concurrent.ExecutorService)org.springframework.test.util.ReflectionTestUtils.getField(worker,"executor");
   dispatchUntil(worker,own.getId(),"PRONTO");assertNull(thread.submit(br.com.obra360.infrastructure.security.TenantContext::getCurrentTenant).get(5,TimeUnit.SECONDS));
   try(var zip=new ZipFile(worker.download(own.getId(),own.getEmpresaId(),own.getUsuarioId()).toFile())){assertArrayEquals(ownBytes,zip.getInputStream(zip.getEntry("arquivos/projeto-"+ownDocument)).readAllBytes());assertNull(zip.getEntry("arquivos/projeto-"+otherDocument));}
   dispatchUntil(worker,other.getId(),"PRONTO");assertNull(thread.submit(br.com.obra360.infrastructure.security.TenantContext::getCurrentTenant).get(5,TimeUnit.SECONDS));
   try(var zip=new ZipFile(worker.download(other.getId(),other.getEmpresaId(),other.getUsuarioId()).toFile())){assertArrayEquals(otherBytes,zip.getInputStream(zip.getEntry("arquivos/projeto-"+otherDocument)).readAllBytes());assertNull(zip.getEntry("arquivos/projeto-"+ownDocument));}
   dispatchUntil(worker,forged.getId(),"FALHA");assertNull(thread.submit(br.com.obra360.infrastructure.security.TenantContext::getCurrentTenant).get(5,TimeUnit.SECONDS));assertFalse(Files.exists(storage.exportPath(forged.getId())));assertEquals(999999L,br.com.obra360.infrastructure.security.TenantContext.getCurrentTenant());
  }finally{worker.stop();br.com.obra360.infrastructure.security.TenantContext.clear();}
 }
}
