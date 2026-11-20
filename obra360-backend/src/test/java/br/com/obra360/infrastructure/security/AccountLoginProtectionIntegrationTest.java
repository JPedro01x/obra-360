package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.entity.EmpresaEntity;
import br.com.obra360.domain.entity.UsuarioEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Uses committed, isolated fixtures: login failures must survive their HTTP transaction. */
@SpringBootTest(properties={
    "obra360.security.requests-per-minute=10000", "AI_ENABLED=false", "EMAIL_ENABLED=false",
    "GOOGLE_CLIENT_ID=", "SEFAZ_ENABLED=false", "obra360.messaging.enabled=false",
    "spring.datasource.url=jdbc:h2:mem:account_login_protection;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=20000",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate",
    "obra360.storage.directory=${java.io.tmpdir}/obra360-auth-protection-${random.uuid}"
})
@ActiveProfiles("dev") @AutoConfigureMockMvc
class AccountLoginProtectionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired EntityManager em;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper json;
    @Autowired PlatformTransactionManager manager;
    private TransactionTemplate tx;
    private Long victim,other;
    private String victimEmail,otherEmail;
    private static final String PASSWORD="SenhaFicticia@12345";
    private final AtomicInteger ips=new AtomicInteger();

    @BeforeEach void fixtures(){
        tx=new TransactionTemplate(manager);
        String suffix=UUID.randomUUID().toString();
        victimEmail="victim-"+suffix+"@test.invalid"; otherEmail="other-"+suffix+"@test.invalid";
        tx.executeWithoutResult(s->{
            var company=EmpresaEntity.builder().nomeFantasia("Teste isolado").razaoSocial("Teste isolado").cnpj(suffix.replace("-", "").substring(0,14)).build();em.persist(company);
            victim=create(company.getId(),victimEmail);other=create(company.getId(),otherEmail);
        });
    }
    private Long create(Long company,String email){
        var user=UsuarioEntity.builder().empresaId(company).nome("Pessoa fictícia").email(email)
            .perfil("ENGENHEIRO").ativo(true).senhaHash(encoder.encode(PASSWORD)).build();em.persist(user);return user.getId();
    }
    private MvcResult login(String email,String password,String ip)throws Exception{
        return mvc.perform(post("/api/v1/auth/login").with(r->{r.setRemoteAddr(ip);return r;})
            .contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"senha",password)))).andReturn();
    }
    private MvcResult login(String email,String password)throws Exception{return login(email,password,"198.51.100."+ips.incrementAndGet());}
    private UsuarioEntity state(Long id){return tx.execute(s->em.find(UsuarioEntity.class,id));}

    @Test void anotherAccountsSuccessCannotEraseVictimFailuresAcrossRotatingIps()throws Exception{
        for(int attempt=0;attempt<5;attempt++){
            assertEquals(401,login(attempt%2==0?victimEmail.toUpperCase(Locale.ROOT):victimEmail,"errada").getResponse().getStatus());
            assertEquals(200,login(otherEmail,PASSWORD).getResponse().getStatus());
        }
        assertEquals(401,login(victimEmail,PASSWORD).getResponse().getStatus(),"Uma conta diferente não pode apagar as falhas da vítima");
        assertEquals(5,state(victim).getTentativasLoginFalhas());
        assertNotNull(state(victim).getBloqueadoAte());
    }

    @Test void blockedAccountUsesGenericFailureAndDoesNotExtendItsDeadline()throws Exception{
        String generic=login(victimEmail,"errada").getResponse().getContentAsString();
        OffsetDateTime deadline=OffsetDateTime.now().plusMinutes(10).withNano(0);
        tx.executeWithoutResult(s->{var user=em.find(UsuarioEntity.class,victim);user.setTentativasLoginFalhas(5);user.setBloqueadoAte(deadline);});
        var result=login(victimEmail,PASSWORD);
        assertEquals(401,result.getResponse().getStatus());assertEquals(generic,result.getResponse().getContentAsString());
        assertEquals(deadline.toInstant(),state(victim).getBloqueadoAte().toInstant());
        assertEquals(5,state(victim).getTentativasLoginFalhas());
    }

    @Test void expiredBlockStartsFreshFailureBudget()throws Exception{
        tx.executeWithoutResult(s->{var user=em.find(UsuarioEntity.class,victim);user.setTentativasLoginFalhas(5);user.setBloqueadoAte(OffsetDateTime.now().minusSeconds(1));});
        assertEquals(401,login(victimEmail,"errada").getResponse().getStatus());
        assertEquals(1,state(victim).getTentativasLoginFalhas());assertNull(state(victim).getBloqueadoAte());
        assertEquals(200,login(victimEmail,PASSWORD).getResponse().getStatus());
    }

    @Test void ownSuccessfulLoginClearsOnlyItsOwnFailureBudget()throws Exception{
        assertEquals(401,login(victimEmail,"errada").getResponse().getStatus());
        assertEquals(401,login(otherEmail,"errada").getResponse().getStatus());
        assertEquals(200,login(victimEmail,PASSWORD).getResponse().getStatus());
        assertEquals(0,state(victim).getTentativasLoginFalhas());
        assertEquals(1,state(other).getTentativasLoginFalhas());
    }

    @Test void concurrentFailuresCannotLoseAccountUpdates()throws Exception{
        var executor=Executors.newFixedThreadPool(5);var ready=new CountDownLatch(5);var start=new CountDownLatch(1);
        try{
            List<Future<Integer>> results=new ArrayList<>();
            for(int i=0;i<5;i++){final String ip="203.0.113."+(i+1);results.add(executor.submit(()->{
                ready.countDown();if(!start.await(10,TimeUnit.SECONDS))throw new IllegalStateException("Barreira expirada");
                return login(victimEmail,"errada",ip).getResponse().getStatus();
            }));}
            assertTrue(ready.await(10,TimeUnit.SECONDS));start.countDown();
            for(var result:results)assertEquals(401,result.get(30,TimeUnit.SECONDS));
        }finally{start.countDown();executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}
        assertEquals(5,state(victim).getTentativasLoginFalhas());assertNotNull(state(victim).getBloqueadoAte());
        assertEquals(401,login(victimEmail,PASSWORD).getResponse().getStatus());
    }
}
