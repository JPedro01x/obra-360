package br.com.obra360.infrastructure.security;
import br.com.obra360.domain.entity.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:gestao_atomic_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate","DOCUMENT_STORAGE=local","obra360.storage.directory=${java.io.tmpdir}/obra360-gestao-documents-${random.uuid}","obra360.security.requests-per-minute=10000"})
@ActiveProfiles("dev") @AutoConfigureMockMvc
class GestaoAtomicIntegrationTest {
 @Autowired EntityManager em;@Autowired PlatformTransactionManager manager;@Autowired MockMvc mvc;@Autowired JwtService jwt;@Autowired ObjectMapper json;
 @Autowired br.com.obra360.application.service.ExportacaoAsyncService exports;
 record Fixture(Long project,Long order,List<Long> lines,List<Long> stocks,String token){}
 private Fixture fixture(){return new TransactionTemplate(manager).execute(status->{
  String key=UUID.randomUUID().toString();var c=EmpresaEntity.builder().cnpj(key.substring(0,14)).razaoSocial("Teste atômico").nomeFantasia("Teste").build();em.persist(c);
  var u=UsuarioEntity.builder().empresaId(c.getId()).email(key+"@test.invalid").nome("Teste").perfil("SUPER_ADMIN").ativo(true).senhaHash("not-used").build();em.persist(u);
  var p=ProjetoObraEntity.builder().empresaId(c.getId()).engenheiroResponsavelId(u.getId()).nome("Obra atômica").vgvEstimado(BigDecimal.ZERO).areaTotalM2(BigDecimal.TEN).dataInicio(LocalDate.now()).dataPrevisaoFim(LocalDate.now()).build();em.persist(p);
  var f=FornecedorB2BEntity.builder().empresaId(c.getId()).cnpj(key.substring(0,14)).razaoSocial("Fornecedor atômico").categoriaFornecimento("INSUMOS").build();em.persist(f);
  var order=new PedidoMateriaisEntity();order.setEmpresaId(c.getId());order.setProjetoObraId(p.getId());order.setFornecedorB2bId(f.getId());order.setJustificativa("Teste de integridade");order.setReferenciaProposta("Teste");order.setTotal(new BigDecimal("20"));order.setSituacao("PEDIDO");order.setVencimento(LocalDate.now());em.persist(order);
  List<Long> lines=new ArrayList<>(),stocks=new ArrayList<>();for(int i=0;i<2;i++){
   var stock=ItemEstoqueEntity.builder().empresaId(c.getId()).projetoObraId(p.getId()).sku(key+i).nome("Material "+i).categoria("Teste").unidadeMedida("un").quantidadeAtual(BigDecimal.ZERO).estoqueMinimo(BigDecimal.ZERO).custoUnitarioMedio(BigDecimal.ONE).build();em.persist(stock);stocks.add(stock.getId());
   var line=new ItemPedidoMateriaisEntity();line.setEmpresaId(c.getId());line.setProjetoObraId(p.getId());line.setPedidoId(order.getId());line.setItemEstoqueId(stock.getId());line.setQuantidade(BigDecimal.TEN);line.setValorUnitario(BigDecimal.ONE);line.setRecebida(BigDecimal.ZERO);line.setDevolvida(BigDecimal.ZERO);em.persist(line);lines.add(line.getId());
  }return new Fixture(p.getId(),order.getId(),lines,stocks,"Bearer "+jwt.issue(u));
 });}
 private int receive(Fixture f,List<Map<String,Object>> lines,String key) throws Exception {return mvc.perform(post("/api/v1/workspace/gestao/pedidos/"+f.order()+"/receber").header("Authorization",f.token()).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"chave",key,"observacao","Recebimento de teste conferido","itens",lines)))).andReturn().getResponse().getStatus();}
 @Test void invalidSecondLineRollsBackFirstLineStockAndAllEvents() throws Exception {
  var f=fixture();assertEquals(409,receive(f,List.of(Map.of("itemId",f.lines().get(0),"quantidade",3),Map.of("itemId",f.lines().get(1),"quantidade",11)),UUID.randomUUID().toString()));
  new TransactionTemplate(manager).executeWithoutResult(status->{for(Long stock:f.stocks())assertEquals(0,em.find(ItemEstoqueEntity.class,stock).getQuantidadeAtual().signum());for(Long line:f.lines())assertEquals(0,em.find(ItemPedidoMateriaisEntity.class,line).getRecebida().signum());assertEquals(0L,em.createQuery("select count(e) from EventoPedidoEntity e where e.pedidoId=:id",Long.class).setParameter("id",f.order()).getSingleResult());});
 }
 @Test void concurrentReceiptsWithSameKeyIncreaseStockOnlyOnce() throws Exception {
  var f=fixture();String key=UUID.randomUUID().toString();var lines=List.<Map<String,Object>>of(Map.of("itemId",f.lines().get(0),"quantidade",2),Map.of("itemId",f.lines().get(1),"quantidade",3));
  var executor=Executors.newFixedThreadPool(2);var start=new CountDownLatch(1);try{
   var a=executor.submit(()->{start.await();return receive(f,lines,key);});var b=executor.submit(()->{start.await();return receive(f,lines,key);});start.countDown();assertEquals(200,a.get(20,TimeUnit.SECONDS));assertEquals(200,b.get(20,TimeUnit.SECONDS));
   new TransactionTemplate(manager).executeWithoutResult(status->{assertEquals(0,new BigDecimal("2").compareTo(em.find(ItemEstoqueEntity.class,f.stocks().get(0)).getQuantidadeAtual()));assertEquals(0,new BigDecimal("3").compareTo(em.find(ItemEstoqueEntity.class,f.stocks().get(1)).getQuantidadeAtual()));assertEquals(1L,em.createQuery("select count(e) from EventoPedidoEntity e where e.pedidoId=:id",Long.class).setParameter("id",f.order()).getSingleResult());});
  }finally{executor.shutdownNow();}
 }
 @Test void asynchronousExportIsPrivateExcludesCredentialsAndExpires() throws Exception {
  var f=fixture();var tx=new TransactionTemplate(manager);
  var project=tx.execute(s->em.find(ProjetoObraEntity.class,f.project()));
  var job=exports.start(project.getEmpresaId(),project.getEngenheiroResponsavelId());
  ExportacaoJobEntity result=null;
  for(int i=0;i<200;i++){result=tx.execute(s->em.find(ExportacaoJobEntity.class,job.getId()));if(!Set.of("FILA","PROCESSANDO").contains(result.getSituacao()))break;Thread.sleep(50);}
  assertNotNull(result);assertEquals("PRONTO",result.getSituacao());
  var file=exports.download(job.getId(),project.getEmpresaId(),project.getEngenheiroResponsavelId());assertTrue(java.nio.file.Files.size(file)>0);
  try(var zip=new java.util.zip.ZipFile(file.toFile())){
   var entries=zip.entries();boolean userFound=false;
   while(entries.hasMoreElements()){var entry=entries.nextElement();if(entry.getName().startsWith("registros/UsuarioEntity/")){String text=new String(zip.getInputStream(entry).readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);assertFalse(text.contains("senhaHash"));assertFalse(text.contains("not-used"));userFound=true;}}
   assertTrue(userFound);
  }
  assertThrows(org.springframework.web.server.ResponseStatusException.class,()->exports.download(job.getId(),project.getEmpresaId()+99999,project.getEngenheiroResponsavelId()));
  tx.executeWithoutResult(s->em.find(ExportacaoJobEntity.class,job.getId()).setExpiraEm(OffsetDateTime.now().minusMinutes(1)));exports.purgeExpired();assertFalse(java.nio.file.Files.exists(file));
 }
}
