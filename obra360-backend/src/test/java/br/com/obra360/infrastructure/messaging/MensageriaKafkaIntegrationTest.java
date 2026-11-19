package br.com.obra360.infrastructure.messaging;

import br.com.obra360.application.service.*;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import br.com.obra360.infrastructure.security.JwtService;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.profiles.active=dev","spring.datasource.url=jdbc:h2:mem:kafka_flow;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=validate","spring.flyway.enabled=true",
    "obra360.jwt.secret=kafka-integration-test-secret-with-at-least-32-bytes",
    "obra360.messaging.enabled=true","obra360.messaging.initial-delay-ms=3600000",
    "obra360.storage.directory=${java.io.tmpdir}/obra360-kafka-${random.uuid}",
    "logging.level.org.apache.kafka=WARN","logging.level.kafka=WARN"
})
@EmbeddedKafka(partitions=1,topics=MensageriaKafkaConfig.TOPIC,bootstrapServersProperty="spring.kafka.bootstrap-servers")
@DirtiesContext
@AutoConfigureMockMvc
class MensageriaKafkaIntegrationTest {
    @Autowired EntityManager em;
    @Autowired PlatformTransactionManager manager;
    @Autowired OperacaoService operations;
    @Autowired MensageriaOrdensService consumer;
    @Autowired MensageriaOutboxPublisher publisher;
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired Obra360KafkaEventProducer producer;
    @Autowired MensageriaFalhasService failures;
    @Autowired RetencaoOperacionalService retention;

    @Test void stalePublicationWithoutReceiptIsRepublishedAndStillProducesOneNotification() {
        var own=fixture();String event=create(own,false);
        tx().executeWithoutResult(s->em.find(EventoMensagemEntity.class,event).setPublicadoEm(OffsetDateTime.now().minusMinutes(10)));
        assertTrue(publisher.pendentes().contains(event),"Published events without a receipt must remain recoverable after broker loss");
        publisher.publicar(event);
        await().atMost(Duration.ofSeconds(30)).untilAsserted(()->assertEquals(1L,tx().execute(s->notifications(own)).longValue()));
        publisher.publicar(event);consumer.processar(event);
        assertEquals(1L,tx().execute(s->notifications(own)).longValue());
        assertFalse(publisher.pendentes().contains(event));
    }

    @Test void retentionIsDryRunByDefaultAndPreservesPendingForeignAndUnresolvedEvents() {
        var own=fixture();var foreign=fixture();String original=create(own,false),foreignEvent=create(foreign,false);
        var old=OffsetDateTime.now().minusDays(100);
        String[] ids=tx().execute(s->{
            var base=em.find(EventoMensagemEntity.class,original);base.setProcessadoEm(old);
            em.find(EventoMensagemEntity.class,foreignEvent).setProcessadoEm(old);
            String[] values=new String[3];
            for(int i=0;i<3;i++){
                var e=new EventoMensagemEntity();e.setId(UUID.randomUUID().toString());e.setEmpresaId(base.getEmpresaId());
                e.setUsuarioId(base.getUsuarioId());e.setOrdemId(base.getOrdemId());e.setProtocolo(base.getProtocolo());
                e.setCriadoEm(old);e.setProximaTentativa(old);
                if(i>0)e.setProcessadoEm(i==1?OffsetDateTime.now():old);
                em.persist(e);values[i]=e.getId();
            }
            return values;
        });
        failures.registrar(new org.apache.kafka.clients.consumer.ConsumerRecord<>(MensageriaKafkaConfig.TOPIC,0,12000L,"ignored",original),new IllegalStateException());
        failures.registrar(new org.apache.kafka.clients.consumer.ConsumerRecord<>(MensageriaKafkaConfig.TOPIC,0,12001L,"ignored",ids[2]),new IllegalStateException());
        tx().executeWithoutResult(s->em.createQuery("update FalhaMensageriaEntity f set f.resolvidoEm=:old where f.eventoId=:id")
            .setParameter("old",old).setParameter("id",original).executeUpdate());
        var preview=retention.cleanMessaging(own.company(),90,false);
        assertEquals(1L,((Number)preview.get("eventosProcessados")).longValue());
        assertEquals(1L,((Number)preview.get("falhasResolvidas")).longValue());
        assertNotNull(tx().execute(s->em.find(EventoMensagemEntity.class,original)));
        retention.cleanMessaging(own.company(),90,true);
        tx().executeWithoutResult(s->{
            assertNull(em.find(EventoMensagemEntity.class,original));
            for(String id:ids)assertNotNull(em.find(EventoMensagemEntity.class,id));
            assertNotNull(em.find(EventoMensagemEntity.class,foreignEvent));
        });
        assertThrows(IllegalArgumentException.class,()->retention.cleanMessaging(own.company(),1,true));
    }

    @Test void quarantinedEventCanOnlyBeReprocessedByAuthorizedUsersOfItsCompany() throws Exception {
        var own=fixture();var foreign=fixture();String event=create(own,false);
        failures.registrar(new org.apache.kafka.clients.consumer.ConsumerRecord<>(MensageriaKafkaConfig.TOPIC,0,9876L,"ignored",event),new IllegalArgumentException("private exception content"));
        String id=tx().execute(s->em.createQuery("select f.id from FalhaMensageriaEntity f where f.eventoId=:e",String.class).setParameter("e",event).getSingleResult());
        String admin=tx().execute(s->{var u=em.find(UsuarioEntity.class,own.user());u.setPerfil("SUPER_ADMIN");return jwt.issue(u);});
        String outsider=tx().execute(s->{var u=em.find(UsuarioEntity.class,foreign.user());u.setPerfil("SUPER_ADMIN");return jwt.issue(u);});
        mvc.perform(get("/api/v1/workspace/mensageria/falhas").header("Authorization","Bearer "+outsider))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(post("/api/v1/workspace/mensageria/falhas/"+id+"/reprocessar").header("Authorization","Bearer "+outsider)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/workspace/mensageria/falhas/"+id+"/reprocessar").header("Authorization","Bearer "+admin)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/workspace/mensageria/falhas/"+id+"/reprocessar").header("Authorization","Bearer "+admin)).andExpect(status().isOk());
        assertEquals(1L,tx().execute(s->notifications(own)).longValue());
        assertFalse(publisher.pendentes().contains(event));
        String auditor=tx().execute(s->{var u=em.find(UsuarioEntity.class,own.user());u.setPerfil("AUDITOR");return jwt.issue(u);});
        mvc.perform(get("/api/v1/workspace/mensageria/falhas").header("Authorization","Bearer "+auditor)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/workspace/mensageria/falhas/"+id+"/reprocessar").header("Authorization","Bearer "+auditor)).andExpect(status().isForbidden());
    }

    @Test void malformedRecordCannotBlockTheNextValidNotification() {
        var fixture=fixture();String event=create(fixture,false);
        producer.publicarEvento(MensageriaKafkaConfig.TOPIC,"invalid", "private-invalid-content-not-to-be-stored");
        publisher.publicar(event);
        await().atMost(Duration.ofSeconds(20)).untilAsserted(()->
            assertEquals(1L,tx().execute(s->notifications(fixture)).longValue()));
        tx().executeWithoutResult(s->{
            Number quarantined=(Number)em.createNativeQuery("select count(*) from falha_mensageria where evento_id is null").getSingleResult();
            assertTrue(quarantined.longValue()>0);
            String hash=(String)em.createNativeQuery("select hash_conteudo from falha_mensageria where evento_id is null fetch first 1 row only").getSingleResult();
            assertTrue(hash.matches("[0-9a-f]{64}"));
        });
    }

    @Test void queueStatusRequiresPermissionAndOnlyCountsTheCurrentCompany() throws Exception {
        var own=fixture();var other=fixture();create(own,false);
        mvc.perform(get("/api/v1/workspace/mensageria")).andExpect(status().isUnauthorized());
        String memberToken=tx().execute(s->jwt.issue(em.find(UsuarioEntity.class,own.user())));
        mvc.perform(get("/api/v1/workspace/mensageria").header("Authorization","Bearer "+memberToken)).andExpect(status().isForbidden());
        String adminToken=tx().execute(s->{var u=em.find(UsuarioEntity.class,own.user());u.setPerfil("SUPER_ADMIN");return jwt.issue(u);});
        String foreignToken=tx().execute(s->{var u=em.find(UsuarioEntity.class,other.user());u.setPerfil("SUPER_ADMIN");return jwt.issue(u);});
        mvc.perform(get("/api/v1/workspace/mensageria").header("Authorization","Bearer "+adminToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$.habilitada").value(true))
            .andExpect(jsonPath("$.pendentesPublicacao").value(1)).andExpect(jsonPath("$.aguardandoProcessamento").value(0));
        mvc.perform(get("/api/v1/workspace/mensageria").header("Authorization","Bearer "+foreignToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$.pendentesPublicacao").value(0));
    }

    @Test void committedOrderTravelsThroughRealKafkaAndPersistsOneTenantNotification() {
        var fixture=fixture();String event=create(fixture,false);
        publisher.publicar(event);
        await().atMost(Duration.ofSeconds(30)).until(()->tx().execute(s->em.find(EventoMensagemEntity.class,event).getProcessadoEm()!=null));
        tx().executeWithoutResult(s->{
            var e=em.find(EventoMensagemEntity.class,event);assertNotNull(e.getPublicadoEm());
            assertEquals(1L,notifications(fixture));
            var notification=em.createQuery("select n from NotificacaoEntity n where n.usuarioId=:u",NotificacaoEntity.class).setParameter("u",fixture.user()).getSingleResult();
            assertEquals(fixture.company(),notification.getEmpresaId());assertTrue(notification.getMensagem().contains(e.getProtocolo()));
        });
        consumer.processar(event);consumer.processar(event);
        assertEquals(1L,tx().execute(s->notifications(fixture)).longValue());
    }

    @Test void rollbackDoesNotLeaveAnEventOrAnOrder() {
        var fixture=fixture();create(fixture,true);
        tx().executeWithoutResult(s->{
            assertEquals(0L,em.createQuery("select count(e) from EventoMensagemEntity e where e.empresaId=:t",Long.class).setParameter("t",fixture.company()).getSingleResult());
            assertEquals(0L,em.createQuery("select count(o) from SolicitacaoServicoEntity o where o.contratoServicoId=:c",Long.class).setParameter("c",fixture.contract()).getSingleResult());
        });
    }

    @Test void brokerFailureKeepsTheEventAndCanBeRetried() {
        var fixture=fixture();String event=create(fixture,false);
        var failing=mock(Obra360KafkaEventProducer.class);
        doThrow(new IllegalStateException("broker offline")).when(failing).publicarEvento(anyString(),anyString(),anyString());
        tx().executeWithoutResult(s->new MensageriaOutboxPublisher(em,failing).publicar(event));
        tx().executeWithoutResult(s->{var e=em.find(EventoMensagemEntity.class,event);assertNull(e.getPublicadoEm());assertEquals(1,e.getTentativas());assertEquals(0L,notifications(fixture));e.setProximaTentativa(OffsetDateTime.now().minusSeconds(1));});
        publisher.publicar(event);
        await().atMost(Duration.ofSeconds(30)).until(()->tx().execute(s->em.find(EventoMensagemEntity.class,event).getProcessadoEm()!=null));
        assertEquals(1L,tx().execute(s->notifications(fixture)).longValue());
    }

    @Test void consumerNeverNotifiesARecipientFromAnotherCompany() {
        var fixture=fixture();var foreign=fixture();String event=create(fixture,false);
        tx().executeWithoutResult(s->em.find(EventoMensagemEntity.class,event).setUsuarioId(foreign.user()));
        consumer.processar(event);
        tx().executeWithoutResult(s->{assertEquals(0L,notifications(fixture));assertEquals(0L,notifications(foreign));assertNotNull(em.find(EventoMensagemEntity.class,event).getProcessadoEm());});
    }

    private TransactionTemplate tx(){return new TransactionTemplate(manager);}
    private long notifications(Fixture f){return em.createQuery("select count(n) from NotificacaoEntity n where n.usuarioId=:u",Long.class).setParameter("u",f.user()).getSingleResult();}
    private String create(Fixture f,boolean rollback){
        try {
            TenantContext.setCurrentTenant(f.company());
            return tx().execute(s->{operations.createOrder(f.contract(),f.team(),"Serviço de teste Kafka","MEDIA",null,f.user());
                String id=em.createQuery("select e.id from EventoMensagemEntity e where e.empresaId=:t",String.class).setParameter("t",f.company()).getSingleResult();
                if(rollback)s.setRollbackOnly();return id;});
        } finally {TenantContext.clear();}
    }
    private Fixture fixture(){return tx().execute(s->{
        String suffix=UUID.randomUUID().toString();
        String cnpj=String.format("%014d",Math.floorMod(UUID.randomUUID().getMostSignificantBits(),100000000000000L));
        var company=EmpresaEntity.builder().cnpj(cnpj).razaoSocial("Teste Kafka").nomeFantasia("Teste Kafka").build();em.persist(company);
        var user=UsuarioEntity.builder().empresaId(company.getId()).nome("Encarregado").email(suffix+"@test.invalid").perfil("MESTRE_OBRA").ativo(true).senhaHash("not-a-login-hash").build();em.persist(user);
        var project=ProjetoObraEntity.builder().empresaId(company.getId()).engenheiroResponsavelId(user.getId()).nome("Obra teste").vgvEstimado(BigDecimal.ZERO).areaTotalM2(BigDecimal.TEN).dataInicio(LocalDate.now()).dataPrevisaoFim(LocalDate.now().plusDays(20)).build();em.persist(project);
        var supplier=FornecedorB2BEntity.builder().empresaId(company.getId()).cnpj(cnpj).razaoSocial("Fornecedor teste").categoriaFornecimento("INSUMOS").statusHomologacao("EM_ANALISE").scoreReputacao(BigDecimal.ZERO).build();em.persist(supplier);
        var contract=ContratoServicoEntity.builder().empresaId(company.getId()).projetoObraId(project.getId()).fornecedorB2bId(supplier.getId()).numeroContrato(suffix).valorTotal(BigDecimal.TEN).tempoLimiteSlaHoras(24).dataInicio(LocalDate.now()).dataTermino(LocalDate.now().plusDays(20)).build();em.persist(contract);
        var team=EquipeTrabalhoEntity.builder().projetoObraId(project.getId()).liderEncarregadoId(user.getId()).nomeEquipe("Equipe teste").especialidade("Teste").quantidadeOperarios(1).build();em.persist(team);
        return new Fixture(company.getId(),user.getId(),contract.getId(),team.getId());
    });}
    record Fixture(Long company,Long user,Long contract,Long team){}
}
