package br.com.obra360.application.service;

import br.com.obra360.domain.entity.ExportacaoJobEntity;
import jakarta.persistence.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.transaction.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExportacaoRecuperavelTest {
 @TempDir Path directory;
 EntityManager em; PlatformTransactionManager manager; ExportacaoEmpresaService exporter;
 @BeforeEach void setup(){em=mock(EntityManager.class);manager=mock(PlatformTransactionManager.class);when(manager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));exporter=mock(ExportacaoEmpresaService.class);}
 @SuppressWarnings("unchecked") TypedQuery<ExportacaoJobEntity> jobs(List<ExportacaoJobEntity> rows){
  var query=(TypedQuery<ExportacaoJobEntity>)mock(TypedQuery.class);when(em.createQuery(anyString(),eq(ExportacaoJobEntity.class))).thenReturn(query);when(query.setParameter(anyString(),any())).thenReturn(query);when(query.setMaxResults(anyInt())).thenReturn(query);when(query.getResultList()).thenReturn(rows);return query;
 }
 ExportacaoAsyncService service(){return new ExportacaoAsyncService(em,manager,new DocumentStorage(directory.toString()),exporter);}
 @Test void restartKeepsQueuedJobDurable() throws Exception {
  var job=new ExportacaoJobEntity();job.setId(UUID.randomUUID().toString());job.setSituacao("FILA");job.setExpiraEm(OffsetDateTime.now().plusHours(1));jobs(List.of(job));
  var service=service();try{service.recover();assertEquals("FILA",job.getSituacao());}finally{service.stop();}
 }
 @Test void secondWriterCannotRecoverOrModifyFirstWritersJobs(){
  jobs(List.of());var first=service();var second=service();try{first.recover();clearInvocations(em);assertThrows(IllegalStateException.class,second::recover);verifyNoInteractions(em);}finally{second.stop();first.stop();}
 }
}
