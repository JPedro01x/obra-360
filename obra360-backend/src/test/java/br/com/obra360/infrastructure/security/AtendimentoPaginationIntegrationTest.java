package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.entity.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"obra360.security.requests-per-minute=10000","DOCUMENT_STORAGE=local","AI_ENABLED=false","EMAIL_ENABLED=false","GOOGLE_CLIENT_ID=","SEFAZ_ENABLED=false","spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect","spring.datasource.url=jdbc:h2:mem:atendimento_pagination;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","spring.flyway.enabled=true","obra360.storage.directory=${java.io.tmpdir}/atendimento-${random.uuid}","spring.jpa.hibernate.ddl-auto=validate"})
@ActiveProfiles("dev") @AutoConfigureMockMvc @Transactional
class AtendimentoPaginationIntegrationTest {
 @Autowired MockMvc mvc; @Autowired EntityManager em; @Autowired JwtService jwt;
 UsuarioEntity admin, own, other;
 @BeforeEach void setup(){
  var company=EmpresaEntity.builder().cnpj("11111111111111").razaoSocial("A").nomeFantasia("A").build(); em.persist(company);
  var foreign=EmpresaEntity.builder().cnpj("22222222222222").razaoSocial("B").nomeFantasia("B").build(); em.persist(foreign);
  admin=user(company.getId(),"SUPER_ADMIN","admin");own=user(company.getId(),"ENGENHEIRO","own");other=user(foreign.getId(),"SUPER_ADMIN","foreign");
  for(int i=0;i<205;i++) ticket(own,"SUPORTE","ABERTO"); ticket(admin,"PRIVACIDADE","CONCLUIDO");ticket(other,"SUPORTE","ABERTO"); em.flush();
 }
 UsuarioEntity user(Long tenant,String role,String name){var u=UsuarioEntity.builder().empresaId(tenant).email(name+"@test.invalid").nome(name).perfil(role).ativo(true).senhaHash("unused").build();em.persist(u);return u;}
 void ticket(UsuarioEntity u,String category,String status){var s=new SolicitacaoAtendimentoEntity();s.setEmpresaId(u.getEmpresaId());s.setUsuarioId(u.getId());s.setCategoria(category);s.setAssunto("Teste");s.setDescricao("Descrição");s.setStatus(status);s.setCriadoEm(OffsetDateTime.now());s.setAtualizadoEm(s.getCriadoEm());em.persist(s);}
 String token(UsuarioEntity u){return "Bearer "+jwt.issue(u);}
 @Test void traversesBeyondLegacyCapWithoutExposingOtherUsersOrTenants() throws Exception {
  mvc.perform(get("/api/v1/workspace/atendimento/pagina?page=10&size=20").header("Authorization",token(own))).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(205)).andExpect(jsonPath("$.items.length()").value(5)).andExpect(jsonPath("$.page").value(10));
  mvc.perform(get("/api/v1/workspace/atendimento/pagina?status=CONCLUIDO&categoria=PRIVACIDADE").header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
  mvc.perform(get("/api/v1/workspace/atendimento/pagina").header("Authorization",token(other))).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
  mvc.perform(get("/api/v1/workspace/atendimento").header("Authorization",token(own))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(200));
 }
 @Test void rejectsUnboundedAndUnknownFilters() throws Exception {
  for(String query:new String[]{"page=-1","size=0","size=101","page=2147483647&size=100","status=UNKNOWN","categoria=UNKNOWN"})mvc.perform(get("/api/v1/workspace/atendimento/pagina?"+query).header("Authorization",token(admin))).andExpect(status().isBadRequest());
 }
 @Test void extractedRulesKeepPendingLimitRoleTenantAndVersionChecks() throws Exception {
  mvc.perform(post("/api/v1/workspace/atendimento").header("Authorization",token(own)).contentType("application/json").content("{\"categoria\":\"SUPORTE\",\"assunto\":\"Limite\",\"descricao\":\"Pendente\"}")).andExpect(status().isConflict());
  var ticket=em.createQuery("select s from SolicitacaoAtendimentoEntity s where s.usuarioId=:u",SolicitacaoAtendimentoEntity.class).setParameter("u",own.getId()).setMaxResults(1).getSingleResult();
  String body="{\"status\":\"EM_ANALISE\",\"resposta\":\"Em análise\",\"versao\":0}";
  mvc.perform(patch("/api/v1/workspace/atendimento/"+ticket.getId()).header("Authorization",token(own)).contentType("application/json").content(body)).andExpect(status().isForbidden());
  mvc.perform(patch("/api/v1/workspace/atendimento/"+ticket.getId()).header("Authorization",token(other)).contentType("application/json").content(body)).andExpect(status().isNotFound());
  mvc.perform(patch("/api/v1/workspace/atendimento/"+ticket.getId()).header("Authorization",token(admin)).contentType("application/json").content(body)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_ANALISE"));
  mvc.perform(patch("/api/v1/workspace/atendimento/"+ticket.getId()).header("Authorization",token(admin)).contentType("application/json").content(body)).andExpect(status().isConflict());
 }
}
