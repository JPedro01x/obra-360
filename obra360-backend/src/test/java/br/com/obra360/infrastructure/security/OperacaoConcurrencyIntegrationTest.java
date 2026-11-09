package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.entity.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
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

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:concurrency_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@ActiveProfiles("dev") @AutoConfigureMockMvc
class OperacaoConcurrencyIntegrationTest {
    @Autowired EntityManager em;@Autowired PlatformTransactionManager manager;@Autowired MockMvc mvc;@Autowired JwtService jwt;@Autowired ObjectMapper json;
    @Test void simultaneousConsumptionCannotOverspendTheSameStock() throws Exception {
        var tx=new TransactionTemplate(manager);
        var fixture=tx.execute(status->{
            var company=EmpresaEntity.builder().cnpj("88888888000100").razaoSocial("Fixture concorrência").nomeFantasia("Fixture").build();em.persist(company);
            var user=UsuarioEntity.builder().empresaId(company.getId()).nome("Teste").email("concurrency@test.invalid").perfil("SUPER_ADMIN").ativo(true).senhaHash("not-used-in-this-test").build();em.persist(user);
            var project=ProjetoObraEntity.builder().empresaId(company.getId()).engenheiroResponsavelId(user.getId()).nome("Obra teste").vgvEstimado(BigDecimal.ZERO).areaTotalM2(BigDecimal.TEN).dataInicio(LocalDate.now()).dataPrevisaoFim(LocalDate.now()).build();em.persist(project);
            var supplier=FornecedorB2BEntity.builder().empresaId(company.getId()).cnpj("99999999000100").razaoSocial("Fornecedor teste").categoriaFornecimento("INSUMOS").statusHomologacao("EM_ANALISE").scoreReputacao(BigDecimal.ZERO).build();em.persist(supplier);
            var contract=ContratoServicoEntity.builder().empresaId(company.getId()).projetoObraId(project.getId()).fornecedorB2bId(supplier.getId()).numeroContrato("CT-CONCURRENCY").valorTotal(BigDecimal.TEN).dataInicio(LocalDate.now()).dataTermino(LocalDate.now()).build();em.persist(contract);
            var team=EquipeTrabalhoEntity.builder().projetoObraId(project.getId()).liderEncarregadoId(user.getId()).nomeEquipe("Equipe teste").especialidade("Teste").quantidadeOperarios(1).build();em.persist(team);
            var item=ItemEstoqueEntity.builder().empresaId(company.getId()).projetoObraId(project.getId()).sku("CONCURRENT").nome("Teste").categoria("Teste").unidadeMedida("un").quantidadeAtual(BigDecimal.TEN).estoqueMinimo(BigDecimal.ZERO).custoUnitarioMedio(BigDecimal.ONE).build();em.persist(item);
            List<Long> orders=new ArrayList<>();for(int i=0;i<2;i++) {var order=SolicitacaoServicoEntity.builder().contratoServicoId(contract.getId()).equipeTrabalhoId(team.getId()).codigoProtocolo("OS-CONCURRENT-"+i).descricao("Teste").dataLimiteSla(OffsetDateTime.now().plusDays(1)).build();em.persist(order);orders.add(order.getId());}
            return new Fixture(item.getId(),orders,"Bearer "+jwt.issue(user));
        });
        ExecutorService executor=Executors.newFixedThreadPool(2);CountDownLatch start=new CountDownLatch(1);
        try {
            List<Future<Integer>> requests=new ArrayList<>();
            for(Long order:fixture.orders())requests.add(executor.submit(()->{
                start.await();return mvc.perform(post("/api/v1/workspace/movimentacoes").header("Authorization",fixture.token()).contentType("application/json")
                    .content(json.writeValueAsString(Map.of("itemEstoqueId",fixture.item(),"tipoMovimentacao","CONSUMO_OS","quantidade",7,"ordemServicoId",order,"chaveOperacao",UUID.randomUUID().toString())))).andReturn().getResponse().getStatus();
            }));
            start.countDown();List<Integer> results=new ArrayList<>();for(var request:requests)results.add(request.get(15,TimeUnit.SECONDS));Collections.sort(results);
            assertEquals(List.of(201,409),results);
            tx.executeWithoutResult(status->{assertEquals(0,new BigDecimal("3").compareTo(em.find(ItemEstoqueEntity.class,fixture.item()).getQuantidadeAtual()));assertEquals(1L,em.createQuery("select count(c) from ConsumoOrdemEntity c",Long.class).getSingleResult());});
        } finally {executor.shutdownNow();}
    }
    record Fixture(Long item,List<Long> orders,String token) {}
}
