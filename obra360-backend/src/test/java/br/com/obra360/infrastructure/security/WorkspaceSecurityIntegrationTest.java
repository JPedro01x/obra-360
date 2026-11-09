package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.entity.*;
import br.com.obra360.domain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(properties = {
    "obra360.security.requests-per-minute=10000","DOCUMENT_STORAGE=local","AI_ENABLED=false","EMAIL_ENABLED=false","GOOGLE_CLIENT_ID=","SEFAZ_ENABLED=false",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.datasource.url=jdbc:h2:mem:workspace_migrations;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=true",
    "MFA_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "obra360.storage.directory=${java.io.tmpdir}/obra360-test-documents-${random.uuid}",
    "spring.jpa.hibernate.ddl-auto=validate"
})
@ActiveProfiles("dev")
@AutoConfigureMockMvc
@Transactional
class WorkspaceSecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired EntityManager em;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired BruteForceProtectionService bruteForce;
    private UsuarioEntity admin;
    private UsuarioEntity engineer;
    private UsuarioEntity outsider;

    @BeforeEach void setup() {
        bruteForce.registrarSucessoLogin("127.0.0.1");
        EmpresaEntity first = EmpresaEntity.builder().cnpj("00000000000001").razaoSocial("Empresa teste A").nomeFantasia("Teste A").build();
        EmpresaEntity second = EmpresaEntity.builder().cnpj("00000000000002").razaoSocial("Empresa teste B").nomeFantasia("Teste B").build();
        em.persist(first); em.persist(second);
        admin = user(first.getId(), "admin@test.invalid", "SUPER_ADMIN");
        engineer = user(first.getId(), "engineer@test.invalid", "ENGENHEIRO");
        outsider = user(second.getId(), "outside@test.invalid", "ENGENHEIRO");
        project(first.getId(), engineer.getId(), "Obra da empresa A");
        project(second.getId(), outsider.getId(), "Obra da empresa B");
        em.flush();
    }
    private UsuarioEntity user(Long company, String email, String role) {
        var user = UsuarioEntity.builder().empresaId(company).email(email).nome("Usuário de teste")
            .perfil(role).ativo(true).senhaHash(encoder.encode("SenhaDeTeste@12345")).build();
        em.persist(user); return user;
    }
    private void project(Long company, Long engineer, String name) {
        em.persist(ProjetoObraEntity.builder().empresaId(company).engenheiroResponsavelId(engineer).nome(name)
            .vgvEstimado(BigDecimal.TEN).areaTotalM2(BigDecimal.TEN).dataInicio(LocalDate.now()).dataPrevisaoFim(LocalDate.now().plusDays(10)).build());
    }
    private String token(UsuarioEntity user) { return "Bearer " + jwt.issue(user); }

    @Test void planReferenceBelongsToTheRevisionAndIsPrivateToTheWork() throws Exception {
        var model = create("/modelador/modelos", Map.of("projetoObraId", ownProject(), "nome", "Modelo com referência"));
        String path = "/api/v1/workspace/modelador/modelos/" + model.get("id").asLong();
        String adminAuth = token(admin);
        var document = modelDocument(List.of(modelElement("wall", "PAREDE")));
        var floor = (Map<?,?>) ((List<?>) document.get("pavimentos")).get(0);
        var save = new java.util.HashMap<String,Object>(Map.of("versao", 0, "nome", "Modelo com referência",
            "documento", document, "motivo", "Referência calibrada"));
        byte[] bytes = "%PDF-1.7 arquivo de teste".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var revision = new org.springframework.mock.web.MockMultipartFile("revisao", "revisao.json",
            "application/json", json.writeValueAsBytes(save));
        var metadata = new org.springframework.mock.web.MockMultipartFile("referencia", "referencia.json",
            "application/json", json.writeValueAsBytes(Map.of("pavimentoId", floor.get("id"), "pagina", 2,
                "x", -4, "z", -2, "largura", 12, "altura", 8, "calibrada", true)));
        var original = new org.springframework.mock.web.MockMultipartFile("arquivo", "planta.pdf", "application/pdf", bytes);
        var response = mvc.perform(multipart(org.springframework.http.HttpMethod.PUT, path)
                .file(revision).file(metadata).file(original).header("Authorization", adminAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.referencia.pagina").value(2))
            .andExpect(jsonPath("$.referencia.arquivoKey").doesNotExist()).andReturn();
        var saved = json.readTree(response.getResponse().getContentAsString());
        String historyFile = path + "/revisoes/2/referencia";
        mvc.perform(get(historyFile).header("Authorization", token(engineer)))
            .andExpect(status().isOk()).andExpect(content().bytes(bytes));
        mvc.perform(get(historyFile).header("Authorization", token(outsider))).andExpect(status().isNotFound());
        var client = user(admin.getEmpresaId(), "referencia-cliente@test.invalid", "CLIENTE");
        mvc.perform(get(historyFile).header("Authorization", token(client))).andExpect(status().isForbidden());
        mvc.perform(get(path + "/revisoes/1/referencia").header("Authorization", adminAuth))
            .andExpect(status().isNotFound());
        save.put("versao", saved.get("versao").asLong());
        save.put("removerReferencia", true);
        var removed = mvc.perform(put(path).header("Authorization", adminAuth).contentType("application/json")
                .content(json.writeValueAsString(save)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(3))
            .andExpect(jsonPath("$.referencia").doesNotExist()).andReturn();
        mvc.perform(get(historyFile).header("Authorization", adminAuth)).andExpect(content().bytes(bytes));
        long revisionId = em.createQuery("select r.id from ModeloRevisaoEntity r where r.modeloId=:id and r.numero=2", Long.class)
            .setParameter("id", model.get("id").asLong()).getSingleResult();
        mvc.perform(post(path + "/restaurar").header("Authorization", adminAuth).contentType("application/json")
                .content(json.writeValueAsString(Map.of("versao", json.readTree(removed.getResponse().getContentAsString())
                    .get("versao").asLong(), "revisaoId", revisionId, "motivo", "Repor referência"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.referencia.calibrada").value(true));
        mvc.perform(get(path + "/revisoes/4/referencia").header("Authorization", adminAuth))
            .andExpect(status().isOk()).andExpect(content().bytes(bytes));
    }

    @Test void serverDraftsArePrivateVersionedAndSeparateFromOfficialRevisions() throws Exception {
        long id = create("/modelador/modelos", Map.of("projetoObraId", ownProject(), "nome", "Modelo com rascunho")).get("id").asLong();
        String modelPath = "/api/v1/workspace/modelador/modelos/" + id;
        String draftPath = modelPath + "/rascunho";
        String adminAuth = token(admin), otherSession = token(admin), engineerAuth = token(engineer);
        var document = modelDocument(List.of(modelElement("draft-wall", "PAREDE")));
        var request = new java.util.HashMap<String,Object>(Map.of("versaoBase", 0, "nome", "Rascunho A", "documento", document));
        var created = mvc.perform(put(draftPath).header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(request)))
            .andExpect(status().isOk()).andReturn();
        String firstToken = json.readTree(created.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get(draftPath).header("Authorization", otherSession))
            .andExpect(status().isOk()).andExpect(jsonPath("$.documento.elementos.length()").value(1));
        mvc.perform(get(draftPath).header("Authorization", engineerAuth)).andExpect(status().isNoContent());
        mvc.perform(get(draftPath).header("Authorization", token(outsider))).andExpect(status().isNotFound());
        mvc.perform(get(modelPath).header("Authorization", adminAuth))
            .andExpect(jsonPath("$.revisao").value(1)).andExpect(jsonPath("$.documento.elementos.length()").value(0));
        mvc.perform(put(draftPath).header("Authorization", engineerAuth)
            .contentType("application/json").content(json.writeValueAsString(request))).andExpect(status().isOk());
        request.put("token", firstToken);
        var updated = mvc.perform(put(draftPath).header("Authorization", otherSession)
            .contentType("application/json").content(json.writeValueAsString(request)))
            .andExpect(status().isOk()).andReturn();
        String latestToken = json.readTree(updated.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(put(draftPath).header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(request))).andExpect(status().isConflict());
        mvc.perform(delete(draftPath).param("token", firstToken).header("Authorization", adminAuth))
            .andExpect(status().isConflict());
        mvc.perform(put(modelPath).header("Authorization", adminAuth).contentType("application/json")
            .content(json.writeValueAsString(Map.of("versao", 0, "nome", "Modelo com rascunho",
                "documento", document, "motivo", "Revisão oficial", "rascunhoToken", latestToken))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(2));
        mvc.perform(get(draftPath).header("Authorization", adminAuth)).andExpect(status().isNoContent());
        mvc.perform(get(draftPath).header("Authorization", engineerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Rascunho A"));
    }

    @Test void publishedPlansFollowUnitLinksAcrossProjectsAndProtectRevisionFrames() throws Exception {
        Long firstProject = ownProject();
        project(admin.getEmpresaId(), engineer.getId(), "Segunda obra do cliente");
        Long secondProject = em.createQuery("select p.id from ProjetoObraEntity p where p.nome=:name", Long.class)
            .setParameter("name", "Segunda obra do cliente").getSingleResult();
        var customer = user(admin.getEmpresaId(), "plantas-cliente@test.invalid", "CLIENTE");
        var otherCustomer = user(admin.getEmpresaId(), "outro-cliente@test.invalid", "CLIENTE");
        String adminAuth = token(admin), customerAuth = token(customer), otherAuth = token(otherCustomer);
        long firstUnit = create("/unidades", Map.of("projetoObraId", firstProject, "codigoUnidade", "A1",
            "areaPrivativaM2", 50, "valorTabela", 100)).get("id").asLong();
        long secondUnit = create("/unidades", Map.of("projetoObraId", secondProject, "codigoUnidade", "B1",
            "areaPrivativaM2", 60, "valorTabela", 100)).get("id").asLong();
        long firstAccess = create("/acessos", Map.of("usuarioId", customer.getId(), "projetoObraId", firstProject,
            "unidadeImobiliariaId", firstUnit)).get("id").asLong();
        create("/acessos", Map.of("usuarioId", customer.getId(), "projetoObraId", secondProject,
            "unidadeImobiliariaId", secondUnit));
        String internal = "/api/v1/workspace/modelador/modelos/";
        String firstPortal = "/api/v1/portal/unidades/" + firstUnit + "/plantas";
        String secondPortal = "/api/v1/portal/unidades/" + secondUnit + "/plantas";
        long first = create("/modelador/modelos", Map.of("projetoObraId", firstProject, "nome", "Planta A")).get("id").asLong();
        long alternative = create("/modelador/modelos", Map.of("projetoObraId", firstProject, "nome", "Alternativa A")).get("id").asLong();
        long second = create("/modelador/modelos", Map.of("projetoObraId", secondProject, "nome", "Planta B")).get("id").asLong();
        mvc.perform(get(firstPortal).header("Authorization", customerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(patch(internal + first + "/publicacao").header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(Map.of("versao", 0, "unidadeId", secondUnit))))
            .andExpect(status().isBadRequest());
        for (long model : new long[]{first, alternative, second}) {
            long unit = model == second ? secondUnit : firstUnit;
            mvc.perform(patch(internal + model + "/publicacao").header("Authorization", adminAuth)
                .contentType("application/json").content(json.writeValueAsString(Map.of("versao", 0, "unidadeId", unit))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.unidadePublicadaId").value(unit));
        }
        mvc.perform(get(firstPortal).header("Authorization", customerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get(secondPortal + "/" + second).header("Authorization", customerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.documento.pavimentos[0].nome").value("Térreo"));
        mvc.perform(get(firstPortal + "/" + first).header("Authorization", otherAuth)).andExpect(status().isNotFound());
        mvc.perform(get(firstPortal + "/" + second).header("Authorization", customerAuth)).andExpect(status().isNotFound());
        var edited = modelSave(first, 1, modelDocument(java.util.List.of(modelElement("wall-1", "PAREDE"))));
        org.junit.jupiter.api.Assertions.assertEquals(2, edited.get("revisao").asInt());
        long editedVersion = edited.get("versao").asLong();
        mvc.perform(get(firstPortal + "/" + first).header("Authorization", customerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(1))
            .andExpect(jsonPath("$.nome").value("Planta A"))
            .andExpect(jsonPath("$.documento.elementos.length()").value(0));
        mvc.perform(patch(internal + first + "/publicacao").header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(Map.of(
                "versao", editedVersion, "unidadeId", firstUnit, "revisao", 999))))
            .andExpect(status().isBadRequest());
        var republished = mvc.perform(patch(internal + first + "/publicacao").header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(Map.of(
                "versao", editedVersion, "unidadeId", firstUnit, "revisao", 2))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisaoPublicada").value(2)).andReturn();
        long republishedVersion = json.readTree(republished.getResponse().getContentAsString()).get("versao").asLong();
        mvc.perform(get(firstPortal + "/" + first).header("Authorization", customerAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(2))
            .andExpect(jsonPath("$.documento.elementos.length()").value(1));
        mvc.perform(get(internal + first + "/publicacoes").header("Authorization", adminAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
            .andExpect(jsonPath("$.items[0].revisao").value(2))
            .andExpect(jsonPath("$.items[0].autor").value(admin.getNome()))
            .andExpect(jsonPath("$.items[0].unidadeCodigo").value("A1"));
        mvc.perform(get(internal + first + "/publicacoes").header("Authorization", token(engineer)))
            .andExpect(status().isForbidden());
        mvc.perform(get(internal + first + "/revisoes/1").header("Authorization", adminAuth))
            .andExpect(status().isOk()).andExpect(jsonPath("$.documento.pavimentos.length()").value(1));
        mvc.perform(get(internal + first + "/revisoes/1").header("Authorization", customerAuth)).andExpect(status().isForbidden());
        mvc.perform(get(internal + first + "/revisoes/1").header("Authorization", token(outsider))).andExpect(status().isNotFound());
        mvc.perform(patch(internal + first + "/status").header("Authorization", adminAuth)
            .contentType("application/json").content(json.writeValueAsString(Map.of(
                "versao", republishedVersion, "arquivado", true)))).andExpect(status().isOk());
        mvc.perform(get(firstPortal + "/" + first).header("Authorization", customerAuth)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/workspace/acessos/" + firstAccess).header("Authorization", adminAuth))
            .andExpect(status().isNoContent());
        mvc.perform(get(firstPortal + "/" + alternative).header("Authorization", customerAuth)).andExpect(status().isNotFound());
        mvc.perform(get(secondPortal + "/" + second).header("Authorization", customerAuth)).andExpect(status().isOk());
    }

    @Test void duplicateModelNamesReturnConflictWithoutLosingTheDraftOrCreatingHistory() throws Exception {
        Long project=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();
        String auth=token(admin);
        var first=mvc.perform(post("/api/v1/workspace/modelador/modelos").header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(Map.of("projetoObraId",project,"nome","Modelo existente")))).andExpect(status().isCreated()).andReturn();
        var original=json.readTree(first.getResponse().getContentAsString());
        var second=mvc.perform(post("/api/v1/workspace/modelador/modelos").header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(Map.of("projetoObraId",project,"nome","Modelo alternativo")))).andExpect(status().isCreated()).andReturn();
        var alternative=json.readTree(second.getResponse().getContentAsString());long id=alternative.get("id").asLong();
        var data=new java.util.LinkedHashMap<String,Object>();data.put("versao",alternative.get("versao").asLong());data.put("nome","Modelo existente");data.put("documento",original.get("documento"));data.put("motivo","Importação com nome repetido");
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(data)))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.detail").value("Já existe um modelo com esse nome na obra. Escolha outro nome para salvar."));
        org.junit.jupiter.api.Assertions.assertEquals("Modelo alternativo",em.find(ModeloObraEntity.class,id).getNome());
        org.junit.jupiter.api.Assertions.assertEquals(1L,em.createQuery("select count(r) from ModeloRevisaoEntity r where r.modeloId=:id",Long.class).setParameter("id",id).getSingleResult());
        data.put("nome","Importação renomeada");
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(data)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(2));
    }

    @Test void selectingAProfileCannotPromoteTheAuthenticatedAccount() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",engineer.getEmail(),"senha","SenhaDeTeste@12345","perfil","SUPER_ADMIN"))))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",engineer.getEmail(),"senha","SenhaDeTeste@12345","perfil","ENGENHEIRO"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.perfil").value("ENGENHEIRO"));
    }

    @Test void invitationsReserveSeatsAndCannotChangeTenantOrRoleDuringAcceptance() throws Exception {
        var l=new LicencaEmpresaEntity();l.setEmpresaId(admin.getEmpresaId());l.setLimiteUsuarios(3);em.persist(l);em.flush();
        String auth=token(admin);
        var invitation=mvc.perform(post("/api/v1/workspace/convites").header("Authorization",auth).contentType("application/json")
            .content("{\"email\":\"invited@test.invalid\",\"perfil\":\"RH\"}")).andExpect(status().isCreated()).andReturn();
        String raw=json.readTree(invitation.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/v1/workspace/convites").header("Authorization",auth).contentType("application/json")
            .content("{\"email\":\"another@test.invalid\",\"perfil\":\"RH\"}")).andExpect(status().isConflict());
        String accept=json.writeValueAsString(Map.of("token",raw,"nome","Convidado de teste","senha","SenhaDoConvidado@12345","empresaId",outsider.getEmpresaId(),"perfil","SUPER_ADMIN"));
        mvc.perform(post("/api/v1/auth/aceitar-convite").contentType("application/json").content(accept)).andExpect(status().isNoContent());
        var invited=em.createQuery("select u from UsuarioEntity u where u.email='invited@test.invalid'",UsuarioEntity.class).getSingleResult();
        org.junit.jupiter.api.Assertions.assertEquals(admin.getEmpresaId(),invited.getEmpresaId());
        org.junit.jupiter.api.Assertions.assertEquals("RH",invited.getPerfil());
        mvc.perform(post("/api/v1/auth/aceitar-convite").contentType("application/json").content(accept)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/workspace/convites").header("Authorization",auth)).andExpect(status().isOk()).andExpect(jsonPath("$[0].tokenHash").doesNotExist());
    }

    @Test void companyExportIsReauthenticatedAndNeverLeaksOtherTenantsOrCredentials() throws Exception {
        String auth=token(admin);
        mvc.perform(post("/api/v1/workspace/exportar").header("Authorization",token(engineer)).contentType("application/json").content("{\"senha\":\"SenhaDeTeste@12345\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/workspace/exportar").header("Authorization",auth).contentType("application/json").content("{\"senha\":\"errada\"}")).andExpect(status().isBadRequest());
        var result=mvc.perform(post("/api/v1/workspace/exportar").header("Authorization",auth).contentType("application/json").content("{\"senha\":\"SenhaDeTeste@12345\"}"))
            .andExpect(status().isOk()).andExpect(header().string("Content-Type","application/zip")).andReturn();
        var zip=new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(result.getResponse().getContentAsByteArray()));
        StringBuilder content=new StringBuilder();java.util.zip.ZipEntry entry;while((entry=zip.getNextEntry())!=null){content.append(new String(zip.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));}
        org.junit.jupiter.api.Assertions.assertTrue(content.toString().contains("Obra da empresa A"));
        org.junit.jupiter.api.Assertions.assertFalse(content.toString().contains("Obra da empresa B"));
        org.junit.jupiter.api.Assertions.assertFalse(content.toString().contains(outsider.getEmail()));
        org.junit.jupiter.api.Assertions.assertFalse(content.toString().contains("senhaHash"));
        org.junit.jupiter.api.Assertions.assertFalse(content.toString().contains(admin.getSenhaHash()));
    }

    @Test void projectAndModelLimitsAreCheckedByServer() throws Exception {
        var l=new LicencaEmpresaEntity();l.setEmpresaId(admin.getEmpresaId());l.setLimiteProjetos(1);l.setLimiteModelos(1);em.persist(l);em.flush();
        String auth=token(admin);
        mvc.perform(post("/api/v1/workspace/projetos").header("Authorization",auth).contentType("application/json")
            .content(json.writeValueAsString(Map.of("nome","Outra obra","engenheiroResponsavelId",engineer.getId(),"areaTotalM2",10,"vgvEstimado",10,"dataInicio","2026-01-01","dataPrevisaoFim","2026-12-01")))).andExpect(status().isConflict());
        Long project=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();
        String body=json.writeValueAsString(Map.of("projetoObraId",project,"nome","Modelo limite"));
        mvc.perform(post("/api/v1/workspace/modelador/modelos").header("Authorization",auth).contentType("application/json").content(body)).andExpect(status().isCreated());
        mvc.perform(post("/api/v1/workspace/modelador/modelos").header("Authorization",auth).contentType("application/json").content(body)).andExpect(status().isConflict());
    }

    @Test void mfaRequiresSecondFactorRevokesSessionsAndRecoveryCodesCannotBeReused() throws Exception {
        String old=token(admin);
        var preparation=mvc.perform(post("/api/v1/workspace/mfa/preparar").header("Authorization",old).contentType("application/json")
            .content("{\"senha\":\"SenhaDeTeste@12345\"}")).andExpect(status().isOk()).andReturn();
        String secret=json.readTree(preparation.getResponse().getContentAsString()).get("segredo").asText();
        String code=br.com.obra360.application.service.MfaService.totp(br.com.obra360.application.service.MfaService.decode32(secret),java.time.Instant.now().getEpochSecond()/30);
        var activated=mvc.perform(post("/api/v1/workspace/mfa/ativar").header("Authorization",old).contentType("application/json")
            .content(json.writeValueAsString(Map.of("senha","SenhaDeTeste@12345","codigo",code)))).andExpect(status().isOk()).andReturn();
        String recovery=json.readTree(activated.getResponse().getContentAsString()).get("codigosRecuperacao").get(0).asText();
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",old)).andExpect(status().isUnauthorized());
        var login=Map.of("email",admin.getEmail(),"senha","SenhaDeTeste@12345");
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(login)))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("MFA_REQUIRED"))
            .andExpect(jsonPath("$.token").doesNotExist());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(
            json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","errada"))))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").doesNotExist());
        String body=json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","SenhaDeTeste@12345","codigo",recovery));
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(body))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("MFA_INVALID"));
        var stored=em.find(MfaEntity.class,admin.getId());
        org.junit.jupiter.api.Assertions.assertFalse(stored.getSegredoCifrado().contains(secret));
        org.junit.jupiter.api.Assertions.assertFalse(stored.getCodigosHash().contains(recovery));
    }

    @Test void individualSessionRevocationCannotAffectAnotherUser() throws Exception {
        String first=token(admin),second=token(admin),other=token(outsider);
        String id=jwt.sessionId(second.substring(7)),outsideId=jwt.sessionId(other.substring(7));
        mvc.perform(get("/api/v1/workspace/minhas-sessoes").header("Authorization",first))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(delete("/api/v1/workspace/minhas-sessoes/"+outsideId).header("Authorization",first)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/workspace/minhas-sessoes/"+id).header("Authorization",first)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",second)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",first)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/workspace/minhas-sessoes/sair").header("Authorization",first)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",first)).andExpect(status().isUnauthorized());
    }

    @Test void supportRequestsArePrivateAndRequireExplicitAdministrativeResponse() throws Exception {
        String owner=token(engineer),administrator=token(admin),outside=token(outsider);
        var response=mvc.perform(post("/api/v1/workspace/atendimento").header("Authorization",owner).contentType("application/json")
            .content("{\"categoria\":\"EXCLUSAO\",\"assunto\":\"Meus dados\",\"descricao\":\"Solicito análise dos meus dados.\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("ABERTO")).andReturn();
        long id=json.readTree(response.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/v1/workspace/atendimento").header("Authorization",outside)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/workspace/atendimento").header("Authorization",owner)).andExpect(jsonPath("$.length()").value(1));
        String body="{\"status\":\"EM_ANALISE\",\"resposta\":\"Recebido para análise.\",\"versao\":0}";
        mvc.perform(patch("/api/v1/workspace/atendimento/"+id).header("Authorization",owner).contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/workspace/atendimento/"+id).header("Authorization",administrator).contentType("application/json").content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_ANALISE"));
        mvc.perform(patch("/api/v1/workspace/atendimento/"+id).header("Authorization",administrator).contentType("application/json").content(body)).andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertNotNull(em.find(UsuarioEntity.class,engineer.getId()));
    }

    @Test void recoveryTokenIsSingleUseAndInvalidatesPreviousSessions() throws Exception {
        String raw="A".repeat(43),old=token(admin);
        em.persist(PasswordResetEntity.builder().tokenHash(br.com.obra360.application.service.PasswordRecoveryService.hash(raw)).usuarioId(admin.getId()).criadoEm(java.time.OffsetDateTime.now()).expiraEm(java.time.OffsetDateTime.now().plusMinutes(15)).usado(false).build());em.flush();
        String body=json.writeValueAsString(Map.of("token",raw,"senha","NovaSenhaRecuperada@12345"));
        mvc.perform(post("/api/v1/auth/redefinir").contentType("application/json").content(body)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",old)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/redefinir").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","NovaSenhaRecuperada@12345")))).andExpect(status().isOk());
    }
    @Test void unconfiguredServicesNeverFabricateResponses() throws Exception {
        mvc.perform(post("/api/v1/workspace/integracoes/ia").header("Authorization",token(admin)).contentType("application/json").content("{\"pergunta\":\"Teste\",\"autorizaEnvio\":true}")).andExpect(status().isServiceUnavailable());
        mvc.perform(post("/api/v1/workspace/integracoes/ia").header("Authorization",token(admin)).contentType("application/json").content("{\"pergunta\":\"Teste\",\"autorizaEnvio\":false}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/recuperar").contentType("application/json").content("{\"email\":\"missing@test.invalid\"}")).andExpect(status().isServiceUnavailable());
        mvc.perform(post("/api/v1/auth/google").contentType("application/json").content("{\"credential\":\"forged\"}")).andExpect(status().isServiceUnavailable());
    }
    @Test void customerPortalRequiresExplicitUnitBindingAndRevocationIsImmediate() throws Exception {
        var customer=user(admin.getEmpresaId(),"customer@test.invalid","CLIENTE");Long project=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();
        Long own=create("/unidades",Map.of("projetoObraId",project,"codigoUnidade","PRIVATE-101","areaPrivativaM2",50,"valorTabela",100)).get("id").asLong();
        Long other=create("/unidades",Map.of("projetoObraId",project,"codigoUnidade","PRIVATE-202","areaPrivativaM2",50,"valorTabela",200)).get("id").asLong();
        Long access=create("/acessos",Map.of("usuarioId",customer.getId(),"projetoObraId",project,"unidadeImobiliariaId",own)).get("id").asLong();
        mvc.perform(get("/api/v1/portal").header("Authorization",token(customer))).andExpect(status().isOk()).andExpect(jsonPath("$.unidades.length()").value(1)).andExpect(jsonPath("$.unidades[0].codigo").value("PRIVATE-101"));
        mvc.perform(get("/api/v1/workspace/registros/unidades").header("Authorization",token(customer))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/portal/chamados").header("Authorization",token(customer)).contentType("application/json").content(json.writeValueAsString(Map.of("unidadeId",other,"descricao","Teste","categoria","Teste")))).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/portal/chamados").header("Authorization",token(customer)).contentType("application/json").content(json.writeValueAsString(Map.of("unidadeId",own,"descricao","Teste","categoria","Teste")))).andExpect(status().isCreated()).andExpect(jsonPath("$.usuarioClienteId").value(customer.getId()));
        mvc.perform(delete("/api/v1/workspace/acessos/"+access).header("Authorization",token(admin))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/portal").header("Authorization",token(customer))).andExpect(jsonPath("$.unidades.length()").value(0));
    }
    @Test void brokerCannotReserveAnUnavailableUnitAndInvestorDoesNotGetPrivateUnits() throws Exception {
        var broker=user(admin.getEmpresaId(),"broker@test.invalid","CORRETOR");var investor=user(admin.getEmpresaId(),"investor@test.invalid","INVESTIDOR");Long project=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();
        Long unit=create("/unidades",Map.of("projetoObraId",project,"codigoUnidade","BROKER-101","areaPrivativaM2",50,"valorTabela",100)).get("id").asLong();create("/acessos",Map.of("usuarioId",broker.getId(),"projetoObraId",project));create("/acessos",Map.of("usuarioId",investor.getId(),"projetoObraId",project));
        mvc.perform(post("/api/v1/portal/unidades/"+unit+"/reservar").header("Authorization",token(broker))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/portal/unidades/"+unit+"/reservar").header("Authorization",token(broker))).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/portal").header("Authorization",token(investor))).andExpect(status().isOk()).andExpect(jsonPath("$.unidades.length()").value(0)).andExpect(jsonPath("$.projetos.length()").value(1)).andExpect(jsonPath("$.projetos[0].vgvEstimado").doesNotExist());
    }
    @Test void supplierCannotSubmitProposalUsingAnotherAccountsBinding() throws Exception {
        var ids=workflow();var supplierUser=user(admin.getEmpresaId(),"supplier@test.invalid","FORNECEDOR");Long supplierId=em.createQuery("select f.id from FornecedorB2BEntity f where f.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();Long access=create("/acessos",Map.of("usuarioId",supplierUser.getId(),"projetoObraId",ids.get("project"),"fornecedorB2bId",supplierId)).get("id").asLong();
        mvc.perform(post("/api/v1/portal/propostas").header("Authorization",token(supplierUser)).contentType("application/json").content(json.writeValueAsString(Map.of("acessoId",access,"valor",10,"prazoDias",2)))).andExpect(status().isCreated()).andExpect(jsonPath("$.fornecedorB2bId").value(supplierId));
        mvc.perform(post("/api/v1/portal/propostas").header("Authorization",token(supplierUser)).contentType("application/json").content(json.writeValueAsString(Map.of("acessoId",access+100000,"valor",10,"prazoDias",2)))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/portal").header("Authorization",token(supplierUser))).andExpect(status().isOk()).andExpect(jsonPath("$.contratos.length()").value(1)).andExpect(jsonPath("$.cotacoes.length()").value(1));
    }

    private com.fasterxml.jackson.databind.JsonNode create(String path,Object body) throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/workspace"+path).header("Authorization",token(admin))
            .contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    private Map<String,Long> workflow() throws Exception {
        Long projectId=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:tenant",Long.class).setParameter("tenant",admin.getEmpresaId()).getSingleResult();
        Long supplier=create("/fornecedores",Map.of("cnpj","12345678000190","razaoSocial","Fornecedor de teste","categoriaFornecimento","INSUMOS")).get("id").asLong();
        Long contract=create("/contratos",Map.of("projetoObraId",projectId,"fornecedorB2bId",supplier,"numeroContrato","CT-TESTE","valorTotal",1000,"retencaoTecnicaPct",0,"tempoLimiteSlaHoras",48,"dataInicio",LocalDate.now().toString(),"dataTermino",LocalDate.now().plusDays(30).toString())).get("id").asLong();
        Long team=create("/equipes",Map.of("projetoObraId",projectId,"liderEncarregadoId",engineer.getId(),"nomeEquipe","Equipe de teste","especialidade","ALVENARIA","quantidadeOperarios",3)).get("id").asLong();
        Long item=create("/estoque",Map.of("projetoObraId",projectId,"sku","TEST-01","nome","Material teste","categoria","Insumos","unidadeMedida","kg","estoqueMinimo",5,"custoUnitarioMedio",3.50)).get("id").asLong();
        create("/movimentacoes",Map.of("itemEstoqueId",item,"tipoMovimentacao","ENTRADA","quantidade",10,"chaveOperacao",java.util.UUID.randomUUID().toString()));
        Long order=create("/ordens",Map.of("contratoServicoId",contract,"equipeTrabalhoId",team,"descricao","Serviço de teste","prioridade","MEDIA","dataLimiteSla",java.time.OffsetDateTime.now().plusDays(2).toString())).get("id").asLong();
        return Map.of("project",projectId,"contract",contract,"team",team,"item",item,"order",order);
    }

    @Test void completeWorkOrderConsumptionFlowIsAtomicAuditedAndIdempotent() throws Exception {
        var ids=workflow();String key=java.util.UUID.randomUUID().toString();
        var consumption=Map.of("itemEstoqueId",ids.get("item"),"tipoMovimentacao","CONSUMO_OS","quantidade",4,"ordemServicoId",ids.get("order"),"chaveOperacao",key);
        Long first=create("/movimentacoes",consumption).get("id").asLong();
        org.junit.jupiter.api.Assertions.assertEquals(first,create("/movimentacoes",consumption).get("id").asLong());
        mvc.perform(get("/api/v1/workspace/registros/estoque").header("Authorization",token(admin)))
            .andExpect(jsonPath("$.items[0].quantidadeAtual").value(6));
        mvc.perform(get("/api/v1/workspace/registros/consumos").header("Authorization",token(admin)))
            .andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].custoTotalInsumo").value(14));
        mvc.perform(get("/api/v1/workspace/registros/movimentacoes").header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(2));
        for(String state:new String[]{"EM_ANDAMENTO","CONCLUIDO"}) mvc.perform(patch("/api/v1/workspace/ordens/"+ids.get("order")+"/status").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("status",state))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statusOs").value(state));
        mvc.perform(get("/api/v1/workspace/resumo").header("Authorization",token(admin))).andExpect(status().isOk())
            .andExpect(jsonPath("$.ordensAbertas").value(0)).andExpect(jsonPath("$.custoConsumido").value(14));
        org.junit.jupiter.api.Assertions.assertTrue(em.createQuery("select count(l) from LogAuditoriaEntity l where l.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult()>=8);
    }
    @Test void negativeStockClosedOrdersAndCrossCompanyOperationsAreRejected() throws Exception {
        var ids=workflow();
        mvc.perform(post("/api/v1/workspace/movimentacoes").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("itemEstoqueId",ids.get("item"),"tipoMovimentacao","SAIDA","quantidade",11,"chaveOperacao",java.util.UUID.randomUUID().toString())))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/workspace/movimentacoes").header("Authorization",token(outsider)).contentType("application/json").content(json.writeValueAsString(Map.of("itemEstoqueId",ids.get("item"),"tipoMovimentacao","SAIDA","quantidade",1,"chaveOperacao",java.util.UUID.randomUUID().toString())))).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/workspace/ordens/"+ids.get("order")+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"status\":\"CONCLUIDO\"}")).andExpect(status().isConflict());
        mvc.perform(patch("/api/v1/workspace/ordens/"+ids.get("order")+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"status\":\"CANCELADO\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/workspace/movimentacoes").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("itemEstoqueId",ids.get("item"),"tipoMovimentacao","CONSUMO_OS","quantidade",1,"ordemServicoId",ids.get("order"),"chaveOperacao",java.util.UUID.randomUUID().toString())))).andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertEquals(0,em.find(ItemEstoqueEntity.class,ids.get("item")).getQuantidadeAtual().compareTo(BigDecimal.TEN));
    }
    @Test void passwordChangesRevokeExistingSessions() throws Exception {
        String old=token(admin);
        mvc.perform(put("/api/v1/workspace/minha-senha").header("Authorization",old).contentType("application/json").content("{\"senhaAtual\":\"SenhaDeTeste@12345\",\"novaSenha\":\"SenhaNovaDeTeste@12345\"}")).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",old)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","SenhaNovaDeTeste@12345")))).andExpect(status().isOk());
    }
    @Test void administratorDeactivationRevokesTokensAndCannotDisableHimself() throws Exception {
        String old=token(engineer);
        mvc.perform(patch("/api/v1/workspace/usuarios/"+engineer.getId()).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("nome",engineer.getNome(),"email",engineer.getEmail(),"perfil","ENGENHEIRO","ativo",false)))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",old)).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/workspace/usuarios/"+admin.getId()).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("nome",admin.getNome(),"email",admin.getEmail(),"perfil","SUPER_ADMIN","ativo",false)))).andExpect(status().isConflict());
    }
    @Test void documentsAreStoredVersionedAndScoped() throws Exception {
        Long projectId=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:tenant",Long.class).setParameter("tenant",admin.getEmpresaId()).getSingleResult();
        var file=new org.springframework.mock.web.MockMultipartFile("arquivo","teste.pdf","application/pdf","%PDF-test".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var result=mvc.perform(multipart("/api/v1/workspace/documentos").file(file).param("projetoObraId",projectId.toString()).param("titulo","Documento teste").param("tipoDocumento","PDF").header("Authorization",token(admin))).andExpect(status().isCreated()).andReturn();
        Long id=json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/v1/workspace/documentos/"+id+"/arquivo").header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(content().bytes("%PDF-test".getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        mvc.perform(get("/api/v1/workspace/documentos/"+id+"/arquivo").header("Authorization",token(outsider))).andExpect(status().isNotFound());
        mvc.perform(multipart("/api/v1/workspace/documentos").file(file).param("projetoObraId",projectId.toString()).param("titulo","Documento teste").param("tipoDocumento","PDF").param("documentoAnteriorId",id.toString()).header("Authorization",token(admin))).andExpect(status().isCreated()).andExpect(jsonPath("$.versao").value(2));
    }
    @Test void additionalModulesPersistAndValidateUpdates() throws Exception {
        Long projectId=em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:tenant",Long.class).setParameter("tenant",admin.getEmpresaId()).getSingleResult();
        Long stage=create("/cronograma",Map.of("projetoObraId",projectId,"nomeEtapa","Etapa teste","ordemExecucao",1,"dataInicioPrevista",LocalDate.now().toString(),"dataFimPrevista",LocalDate.now().plusDays(1).toString())).get("id").asLong();
        mvc.perform(patch("/api/v1/workspace/cronograma/"+stage+"/progresso").header("Authorization",token(admin)).contentType("application/json").content("{\"percentualExecutado\":50}")).andExpect(status().isOk()).andExpect(jsonPath("$.percentualExecutado").value(50));
        mvc.perform(patch("/api/v1/workspace/cronograma/"+stage+"/progresso").header("Authorization",token(admin)).contentType("application/json").content("{\"percentualExecutado\":101}")).andExpect(status().isBadRequest());
        Long quality=create("/qualidade",Map.of("projetoObraId",projectId,"responsavelId",engineer.getId(),"titulo","Ocorrência teste","normaRegulamentadora","Referência teste","grauSeveridade","ALTA")).get("id").asLong();
        mvc.perform(patch("/api/v1/workspace/qualidade/"+quality+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"status\":\"RESOLVIDO\"}")).andExpect(status().isOk());
        Long unit=create("/unidades",Map.of("projetoObraId",projectId,"codigoUnidade","UN-TEST","areaPrivativaM2",50,"valorTabela",1000)).get("id").asLong();
        mvc.perform(patch("/api/v1/workspace/unidades/"+unit+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"status\":\"RESERVADO\",\"situacaoEsperada\":\"DISPONIVEL\"}")).andExpect(status().isOk());
        mvc.perform(patch("/api/v1/workspace/unidades/"+unit+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"status\":\"VENDIDO\",\"situacaoEsperada\":\"DISPONIVEL\"}")).andExpect(status().isConflict());
        create("/garantias",Map.of("unidadeImobiliariaId",unit,"usuarioClienteId",engineer.getId(),"categoriaDefeito","Teste","descricaoDefeito","Descrição de teste"));
    }

    @Test void invalidCredentialsNeverAuthenticate() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","errada"))))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.token").doesNotExist());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{\"email\":\"missing@test.invalid\",\"senha\":\"errada\"}"))
            .andExpect(status().isUnauthorized());
    }
    @Test void validLoginReturnsSignedTokenWithoutPassword() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","SenhaDeTeste@12345"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.token", matchesPattern("[^.]+\\.[^.]+\\.[^.]+")))
            .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }
    @Test void inactiveUsersCannotLoginOrReuseTokens() throws Exception {
        String oldToken = token(admin); admin.setAtivo(false); em.flush();
        mvc.perform(get("/api/v1/workspace/sessao").header("Authorization",oldToken)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content(json.writeValueAsString(Map.of("email",admin.getEmail(),"senha","SenhaDeTeste@12345"))))
            .andExpect(status().isUnauthorized());
    }
    @Test void anonymousAndForgedTokensAreRejected() throws Exception {
        mvc.perform(get("/api/v1/workspace/registros/projetos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/workspace/registros/projetos").header("Authorization","Bearer mock-jwt-token-1" )).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/cadastrar").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
    }
    @Test void companyScopeCannotBeOverriddenByClient() throws Exception {
        mvc.perform(get("/api/v1/workspace/registros/projetos").header("Authorization",token(admin)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
            .andExpect(jsonPath("$.items[0].nome").value("Obra da empresa A"));
        mvc.perform(get("/api/v1/workspace/registros/projetos").header("Authorization",token(admin)).header("X-Tenant-ID",outsider.getEmpresaId()))
            .andExpect(status().isForbidden());
    }
    @Test void allReadQueriesExecuteAgainstDatabase() throws Exception {
        for (String resource : new String[]{"estoque","documentos","cronograma","qualidade","equipes","unidades","contratos","cotacoes","auditoria","ordens","garantias"}) {
            mvc.perform(get("/api/v1/workspace/registros/" + resource).header("Authorization",token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        }
    }
    @Test void roleChecksAndPaginationAreEnforced() throws Exception {
        mvc.perform(get("/api/v1/workspace/registros/auditoria").header("Authorization",token(engineer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/registros/projetos?size=1000").header("Authorization",token(admin))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/projetos").header("Authorization",token(admin))).andExpect(status().isForbidden());
    }
    @Test void projectCreationValidatesOwnershipAndPersistsAudit() throws Exception {
        var payload = new java.util.HashMap<String,Object>(Map.of("nome","Nova obra real","engenheiroResponsavelId",outsider.getId(),"vgvEstimado",100,"areaTotalM2",50,"dataInicio","2026-01-01","dataPrevisaoFim","2026-12-31"));
        mvc.perform(post("/api/v1/workspace/projetos").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(payload)))
            .andExpect(status().isBadRequest());
        payload.put("engenheiroResponsavelId",engineer.getId());
        mvc.perform(post("/api/v1/workspace/projetos").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(payload)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.empresaId").value(admin.getEmpresaId()));
        mvc.perform(get("/api/v1/workspace/registros/auditoria").header("Authorization",token(admin)))
            .andExpect(jsonPath("$.items[0].acao").value("CRIAR_PROJETO"));
    }
    @Test void invalidDatesAndMissingFieldsReturnBadRequest() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{}" )).andExpect(status().isBadRequest());
        var payload = Map.of("nome","Obra","engenheiroResponsavelId",engineer.getId(),"vgvEstimado",100,"areaTotalM2",50,"dataInicio","2026-12-31","dataPrevisaoFim","2026-01-01");
        mvc.perform(post("/api/v1/workspace/projetos").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(payload))).andExpect(status().isBadRequest());
    }
    @Test void installationCreatesOnlySuppliedDataAndCannotBeRepeated() throws Exception {
        em.createQuery("delete from ProjetoObraEntity").executeUpdate();
        em.createQuery("delete from UsuarioEntity").executeUpdate();
        em.createQuery("delete from EmpresaEntity").executeUpdate();
        em.clear();
        mvc.perform(get("/api/v1/instalacao")).andExpect(status().isOk()).andExpect(jsonPath("$.necessaria").value(true));
        String payload = json.writeValueAsString(Map.of("nomeFantasia","Empresa informada","razaoSocial","Razão informada LTDA","cnpj","12345678000190","nome","Administrador informado","email","novo@test.invalid","senha","SenhaDeTeste@12345"));
        mvc.perform(post("/api/v1/instalacao").contentType("application/json").content(payload)).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/instalacao")).andExpect(jsonPath("$.necessaria").value(false));
        mvc.perform(post("/api/v1/instalacao").contentType("application/json").content(payload)).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{\"email\":\"novo@test.invalid\",\"senha\":\"SenhaDeTeste@12345\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Administrador informado"));
    }
    @Test void administratorsRegisterUsersOnlyInTheirCompanyAndNeverReturnHashes() throws Exception {
        String payload = json.writeValueAsString(Map.of("empresaId",outsider.getEmpresaId(),"nome","Novo engenheiro","email","new@test.invalid","senhaHash","SenhaDeTeste@12345","perfil","ENGENHEIRO","ativo",true));
        mvc.perform(post("/api/v1/auth/cadastrar").header("Authorization",token(engineer)).contentType("application/json").content(payload))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/cadastrar").header("Authorization",token(admin)).contentType("application/json").content(payload))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.empresaId").value(admin.getEmpresaId())).andExpect(jsonPath("$.senhaHash").doesNotExist());
        mvc.perform(get("/api/v1/workspace/registros/usuarios").header("Authorization",token(admin)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items[*].senhaHash").doesNotExist());
    }

    private com.fasterxml.jackson.databind.JsonNode rh(String resource,Object body) throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/workspace/rh/"+resource).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    private Map<String,Object> hrEmployeeBody(Long department,Long job) {
        return new java.util.HashMap<>(Map.of("matricula","RH-001","nome","Pessoa de teste","cpf","52998224725","admissao",LocalDate.now().minusYears(1).toString(),"vinculo","CLT","departamentoId",department,"cargoId",job,"salarioBase",3000,"jornadaSemanalMinutos",2640));
    }
    private Long hrEmployee() throws Exception {
        Long dep=rh("estrutura",Map.of("tipo","DEPARTAMENTO","nome","Departamento teste","ativo",true)).get("id").asLong();
        Long job=rh("estrutura",Map.of("tipo","CARGO","nome","Cargo teste","departamentoId",dep,"ativo",true)).get("id").asLong();
        return rh("funcionarios",hrEmployeeBody(dep,job)).get("id").asLong();
    }
    @Test void hrRestrictsSensitiveDataAndMasksCpfInLists() throws Exception {
        Long id=hrEmployee();var hr=user(admin.getEmpresaId(),"hr@test.invalid","RH");var foreignHr=user(outsider.getEmpresaId(),"foreign-hr@test.invalid","RH");
        mvc.perform(get("/api/v1/workspace/rh/registros/funcionarios").header("Authorization",token(hr))).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].cpf").value("***.***.247-**"));
        mvc.perform(get("/api/v1/workspace/rh/registros/funcionarios/"+id).header("Authorization",token(engineer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/rh/registros/funcionarios/"+id).header("Authorization",token(foreignHr))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/rh/registros/funcionarios").header("Authorization",token(foreignHr))).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/workspace/registros/usuarios").header("Authorization",token(hr))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/rh/registros/funcionarios?page=-1").header("Authorization",token(admin))).andExpect(status().isBadRequest());
    }
    @Test void hrValidatesCpfStructuresAndStaleEdits() throws Exception {
        Long id=hrEmployee();var employee=em.find(RhFuncionarioEntity.class,id);var body=hrEmployeeBody(employee.getDepartamentoId(),employee.getCargoId());body.put("cpf","00000000000");body.put("matricula","RH-002");
        mvc.perform(post("/api/v1/workspace/rh/funcionarios").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        body.put("cpf","52998224725");body.put("nome","Nome atualizado");
        mvc.perform(put("/api/v1/workspace/rh/funcionarios/"+id+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk()).andExpect(jsonPath("$.versao").value(1));
        mvc.perform(put("/api/v1/workspace/rh/funcionarios/"+id+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isConflict());
        mvc.perform(put("/api/v1/workspace/rh/estrutura/"+employee.getDepartamentoId()+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("tipo","DEPARTAMENTO","nome","Departamento teste","ativo",false)))).andExpect(status().isConflict());
    }
    @Test void hrAttendanceComputesActualIntervalAndLocksApprovedRecord() throws Exception {
        Long id=hrEmployee();var request=Map.of("funcionarioId",id,"data",LocalDate.now().toString(),"entrada","08:00","saidaIntervalo","12:00","retornoIntervalo","13:00","saida","17:00");
        var point=rh("ponto",request);org.junit.jupiter.api.Assertions.assertEquals(480,point.get("minutosTrabalhados").asInt());
        mvc.perform(post("/api/v1/workspace/rh/ponto/"+point.get("id").asLong()+"/aprovar").header("Authorization",token(admin)).contentType("application/json").content("{\"versao\":0}")).andExpect(status().isOk());em.flush();
        mvc.perform(put("/api/v1/workspace/rh/ponto/"+point.get("id").asLong()+"?versao=1").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(request))).andExpect(status().isConflict());
        var invalid=new java.util.HashMap<String,Object>(request);invalid.put("retornoIntervalo","11:00");
        mvc.perform(post("/api/v1/workspace/rh/ponto").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
    }
    @Test void hrRejectsOverlappingApprovedAbsencesAndTerminatedAdmissions() throws Exception {
        Long id=hrEmployee();String start=LocalDate.now().plusDays(1).toString(),end=LocalDate.now().plusDays(10).toString();
        Long first=rh("afastamentos",Map.of("funcionarioId",id,"tipo","FERIAS","inicio",start,"fim",end)).get("id").asLong();
        Long second=rh("afastamentos",Map.of("funcionarioId",id,"tipo","LICENCA","inicio",start,"fim",end)).get("id").asLong();
        mvc.perform(post("/api/v1/workspace/rh/afastamentos/"+first+"/decisao").header("Authorization",token(admin)).contentType("application/json").content("{\"situacao\":\"APROVADO\",\"versao\":0}")).andExpect(status().isOk());em.flush();
        mvc.perform(post("/api/v1/workspace/rh/afastamentos/"+second+"/decisao").header("Authorization",token(admin)).contentType("application/json").content("{\"situacao\":\"APROVADO\",\"versao\":0}")).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/workspace/rh/funcionarios/"+id+"/desligar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("data",LocalDate.now().toString(),"versao",0)))).andExpect(status().isOk());em.flush();
        mvc.perform(post("/api/v1/workspace/rh/afastamentos").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("funcionarioId",id,"tipo","FERIAS","inicio",start,"fim",end)))).andExpect(status().isConflict());
    }
    @Test void hrPayrollUsesManualValuesAndSealsClosedStatements() throws Exception {
        Long id=hrEmployee(),payroll=rh("folhas",Map.of("competencia",java.time.YearMonth.now().toString())).get("id").asLong();
        rh("lancamentos",Map.of("folhaId",payroll,"funcionarioId",id,"codigo","SALARIO","descricao","Valor conferido","natureza","PROVENTO","valor",3000));
        rh("lancamentos",Map.of("folhaId",payroll,"funcionarioId",id,"codigo","DESCONTO","descricao","Valor conferido","natureza","DESCONTO","valor",100));em.flush();
        var sheet=em.find(RhFolhaEntity.class,payroll);
        mvc.perform(post("/api/v1/workspace/rh/folhas/"+payroll+"/fechar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",sheet.getVersao())))).andExpect(status().isOk());em.flush();
        mvc.perform(get("/api/v1/workspace/rh/folhas/"+payroll+"/demonstrativo/"+id).header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.liquido").value(2900));
        mvc.perform(post("/api/v1/workspace/rh/lancamentos").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("folhaId",payroll,"funcionarioId",id,"codigo","OUTRO","descricao","Outro","natureza","PROVENTO","valor",10)))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/workspace/rh/folhas/"+payroll+"/pagar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",sheet.getVersao(),"data",LocalDate.now().toString())))).andExpect(status().isOk());
    }
    @Test void hrTracksBenefitsTrainingAndCandidateRemoval() throws Exception {
        Long id=hrEmployee();rh("beneficios",Map.of("funcionarioId",id,"nome","Transporte","valorEmpresa",200,"descontoFuncionario",20,"inicio",LocalDate.now().toString(),"ativo",true));
        rh("treinamentos",Map.of("funcionarioId",id,"tipo","TREINAMENTO","titulo","Capacitação teste","realizacao",LocalDate.now().toString(),"validade",LocalDate.now().plusDays(10).toString(),"cargaHorariaMinutos",120));
        var person=em.find(RhFuncionarioEntity.class,id);Long vacancy=rh("vagas",Map.of("titulo","Vaga teste","departamentoId",person.getDepartamentoId(),"cargoId",person.getCargoId(),"quantidade",1,"descricao","Requisitos teste","abertura",LocalDate.now().toString(),"situacao","ABERTA")).get("id").asLong();
        Long candidate=rh("candidatos",Map.of("vagaId",vacancy,"nome","Candidato teste","email","candidate@test.invalid","etapa","INSCRITO")).get("id").asLong();
        mvc.perform(delete("/api/v1/workspace/rh/candidatos/"+candidate+"?versao=0").header("Authorization",token(admin))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/workspace/rh/resumo").header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.funcionariosAtivos").value(1)).andExpect(jsonPath("$.validadesAte30Dias").value(1));
        mvc.perform(get("/api/v1/workspace/rh/registros/candidatos").header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(0));
    }

    @Autowired br.com.obra360.application.service.DocumentStorage documentStorage;
    @Test void hrHistoryPreservesSalaryValuesReasonAndActorWithoutPersonalIdentifiers() throws Exception {
        Long id=hrEmployee();var employee=em.find(RhFuncionarioEntity.class,id);var body=hrEmployeeBody(employee.getDepartamentoId(),employee.getCargoId());body.put("salarioBase",3500);body.put("motivoAlteracao","Revisão contratual aprovada");
        mvc.perform(put("/api/v1/workspace/rh/funcionarios/"+id+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk());em.flush();
        mvc.perform(get("/api/v1/workspace/rh/historico?funcionarioId="+id).header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items[0].anterior.salarioBase").value("3000.00")).andExpect(jsonPath("$.items[0].atual.salarioBase").value("3500.00")).andExpect(jsonPath("$.items[0].motivo").value("Revisão contratual aprovada")).andExpect(jsonPath("$.items[0].usuarioId").value(admin.getId())).andExpect(jsonPath("$.items[0].atual.cpf").doesNotExist()).andExpect(jsonPath("$.items[0].atual.email").doesNotExist());
        mvc.perform(get("/api/v1/workspace/rh/historico?funcionarioId="+id).header("Authorization",token(engineer))).andExpect(status().isForbidden());
        var outsideHr=user(outsider.getEmpresaId(),"dossier-other@test.invalid","RH");mvc.perform(get("/api/v1/workspace/rh/historico?funcionarioId="+id).header("Authorization",token(outsideHr))).andExpect(status().isNotFound());
    }
    @Test void hrSalaryChangeRequiresReason() throws Exception {
        Long id=hrEmployee();var employee=em.find(RhFuncionarioEntity.class,id);var body=hrEmployeeBody(employee.getDepartamentoId(),employee.getCargoId());body.put("salarioBase",3500);
        mvc.perform(put("/api/v1/workspace/rh/funcionarios/"+id+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
    }
    @Test void hrExistingStaffStartsWithObservedBaselineInsteadOfInventedAdmissionHistory() throws Exception {
        Long id=hrEmployee();em.createQuery("delete from RhHistoricoEntity h where h.funcionarioId=:id").setParameter("id",id).executeUpdate();
        var employee=em.find(RhFuncionarioEntity.class,id);var body=hrEmployeeBody(employee.getDepartamentoId(),employee.getCargoId());body.put("jornadaSemanalMinutos",2400);body.put("motivoAlteracao","Ajuste de jornada aprovado");
        mvc.perform(put("/api/v1/workspace/rh/funcionarios/"+id+"?versao=0").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(body))).andExpect(status().isOk());em.flush();
        mvc.perform(get("/api/v1/workspace/rh/historico?funcionarioId="+id).header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items[1].tipo").value("BASE_INICIAL")).andExpect(jsonPath("$.items[1].dataReferencia").value(LocalDate.now().toString())).andExpect(jsonPath("$.items[1].atual.jornadaSemanalMinutos").value(2640));
    }
    private com.fasterxml.jackson.databind.JsonNode privateFile(Long employee,Long previous,byte[] bytes) throws Exception {
        var request=multipart("/api/v1/workspace/rh/documentos").file(new org.springframework.mock.web.MockMultipartFile("arquivo","contrato.pdf","application/pdf",bytes)).param("funcionarioId",employee.toString()).param("titulo","Contrato privado").param("categoria","CONTRATO");
        if(previous!=null)request.param("documentoAnteriorId",previous.toString());
        return json.readTree(mvc.perform(request.header("Authorization",token(admin))).andExpect(status().isCreated()).andExpect(jsonPath("$.referenciaArquivo").doesNotExist()).andReturn().getResponse().getContentAsString());
    }
    @Test void hrPrivateFilesKeepVersionsAndDenyOperationalAndOtherCompanyAccess() throws Exception {
        Long employee=hrEmployee();byte[] first="%PDF-1.7\nContrato original".getBytes(java.nio.charset.StandardCharsets.UTF_8),second="%PDF-1.7\nAditivo".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var doc1=privateFile(employee,null,first);Long id=doc1.get("id").asLong();var doc2=privateFile(employee,id,second);org.junit.jupiter.api.Assertions.assertEquals(2,doc2.get("numeroVersao").asInt());
        mvc.perform(get("/api/v1/workspace/rh/documentos/"+id+"/arquivo").header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(content().bytes(first));
        mvc.perform(get("/api/v1/workspace/rh/documentos/"+doc2.get("id").asLong()+"/arquivo").header("Authorization",token(admin))).andExpect(content().bytes(second));
        mvc.perform(get("/api/v1/workspace/rh/documentos/"+id+"/arquivo").header("Authorization",token(engineer))).andExpect(status().isForbidden());
        var other=user(outsider.getEmpresaId(),"private-other@test.invalid","RH");mvc.perform(get("/api/v1/workspace/rh/documentos/"+id+"/arquivo").header("Authorization",token(other))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/rh/documentos").header("Authorization",token(other))).andExpect(jsonPath("$.total").value(0));
        mvc.perform(patch("/api/v1/workspace/rh/documentos/"+id+"/arquivo-status").header("Authorization",token(admin)).contentType("application/json").content("{\"arquivado\":true,\"versao\":0}")).andExpect(status().isOk()).andExpect(jsonPath("$.versao").value(1));
        mvc.perform(get("/api/v1/workspace/rh/documentos?funcionarioId="+employee).header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/workspace/rh/documentos?incluirArquivados=true&funcionarioId="+employee).header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(2));
        mvc.perform(patch("/api/v1/workspace/rh/documentos/"+id+"/arquivo-status").header("Authorization",token(admin)).contentType("application/json").content("{\"arquivado\":false,\"versao\":0}")).andExpect(status().isConflict());
    }
    @Test void hrPrivateFilesRejectMismatchedContentAndDetectTampering() throws Exception {
        Long employee=hrEmployee();
        mvc.perform(multipart("/api/v1/workspace/rh/documentos").file(new org.springframework.mock.web.MockMultipartFile("arquivo","wrong.pdf","application/pdf","not pdf".getBytes())).param("funcionarioId",employee.toString()).param("titulo","Inválido").param("categoria","CONTRATO").header("Authorization",token(admin))).andExpect(status().isBadRequest());
        Long id=privateFile(employee,null,"%PDF-1.7\nOriginal".getBytes()).get("id").asLong();var doc=em.find(RhDocumentoEntity.class,id);
        String key=doc.getReferenciaArquivo();org.junit.jupiter.api.Assertions.assertTrue(key.startsWith("rh:"));
        java.nio.file.Files.write(((java.nio.file.Path)org.springframework.test.util.ReflectionTestUtils.getField(documentStorage,"root")).resolve("rh").resolve(key.substring(3)),"Corrompido".getBytes());
        mvc.perform(get("/api/v1/workspace/rh/documentos/"+id+"/arquivo").header("Authorization",token(admin))).andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,()->documentStorage.read(key));
    }

    private Long ownProject(){return em.createQuery("select p.id from ProjetoObraEntity p where p.empresaId=:t",Long.class).setParameter("t",admin.getEmpresaId()).getSingleResult();}
    private Map<String,Object> modelElement(String id,String type){
        return new java.util.LinkedHashMap<>(Map.ofEntries(Map.entry("id",id),Map.entry("pavimentoId","floor-1"),Map.entry("tipo",type),Map.entry("nome",type+" teste"),Map.entry("x",0),Map.entry("z",0),Map.entry("base",0),Map.entry("largura",5),Map.entry("profundidade",0.15),Map.entry("altura",2.8),Map.entry("rotacao",0),Map.entry("cor","#cbd5e1"),Map.entry("deslocamento",0)));
    }
    private Map<String,Object> modelDocument(java.util.List<Map<String,Object>> elements){return Map.of("schemaVersao",1,"pavimentos",java.util.List.of(Map.of("id","floor-1","nome","Térreo","cota",0,"altura",2.8)),"elementos",elements);}
    private com.fasterxml.jackson.databind.JsonNode modelSave(Long id,long version,Map<String,Object> document) throws Exception {
        return json.readTree(mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",version,"nome","Modelo teste","motivo","Edição verificada","documento",document)))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    @Test void modelEditorPersistsDimensionsOpeningsAndRejectsStaleWrites() throws Exception {
        var created=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste"));Long id=created.get("id").asLong();org.junit.jupiter.api.Assertions.assertEquals(0,created.get("documento").get("elementos").size());
        var wall=modelElement("wall-1","PAREDE");wall.put("rotacao",30);var door=modelElement("door-1","PORTA");door.put("paredeId","wall-1");door.put("largura",0.9);door.put("altura",2.1);
        var saved=modelSave(id,0,modelDocument(java.util.List.of(wall,door)));org.junit.jupiter.api.Assertions.assertEquals(2,saved.get("revisao").asInt());org.junit.jupiter.api.Assertions.assertEquals(1,saved.get("versao").asLong());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.documento.elementos[0].rotacao").value(30)).andExpect(jsonPath("$.documento.elementos[1].paredeId").value("wall-1"));
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Edição atrasada","documento",modelDocument(java.util.List.of(wall)))))).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id+"/revisoes").header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(2));
    }
    @Test void modelEditorRejectsDetachedAndOverlappingOpenings() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();
        var wall=modelElement("wall-1","PAREDE");var a=modelElement("window-1","JANELA");var b=modelElement("window-2","JANELA");
        for(var opening:java.util.List.of(a,b)){opening.put("paredeId","wall-1");opening.put("largura",1);opening.put("altura",1);opening.put("base",1);}
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Teste de sobreposição","documento",modelDocument(java.util.List.of(wall,a,b)))))).andExpect(status().isBadRequest());
        a.put("paredeId","missing");
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Teste de vínculo","documento",modelDocument(java.util.List.of(wall,a)))))).andExpect(status().isBadRequest());
    }
    @Test void modelEditorScopesModelsByCompanyAndEnforcesReadOnlyProfiles() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();var auditor=user(admin.getEmpresaId(),"model-auditor@test.invalid","AUDITOR");var hr=user(admin.getEmpresaId(),"model-hr@test.invalid","RH");
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(outsider))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/modelador/modelos?projetoObraId="+ownProject()).header("Authorization",token(outsider))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(auditor))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/workspace/modelador/modelos").header("Authorization",token(auditor)).contentType("application/json").content(json.writeValueAsString(Map.of("projetoObraId",ownProject(),"nome","Tentativa")))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(hr))).andExpect(status().isForbidden());
    }
    @Test void modelRevisionsRestoreAsNewVersionAndCopiesRemainIndependent() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();
        modelSave(id,0,modelDocument(java.util.List.of(modelElement("wall-1","PAREDE"))));
        Long copy=create("/modelador/modelos/"+id+"/duplicar",Map.of("projetoObraId",ownProject(),"nome","Alternativa teste")).get("id").asLong();
        Long first=em.createQuery("select r.id from ModeloRevisaoEntity r where r.modeloId=:id and r.numero=1",Long.class).setParameter("id",id).getSingleResult();
        mvc.perform(post("/api/v1/workspace/modelador/modelos/"+id+"/restaurar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",1,"revisaoId",first,"motivo","Retornar ao início")))).andExpect(status().isOk()).andExpect(jsonPath("$.revisao").value(3)).andExpect(jsonPath("$.documento.elementos.length()").value(0));
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+copy).header("Authorization",token(admin))).andExpect(jsonPath("$.documento.elementos.length()").value(1));
        mvc.perform(patch("/api/v1/workspace/modelador/modelos/"+copy+"/status").header("Authorization",token(admin)).contentType("application/json").content("{\"versao\":0,\"arquivado\":true}")).andExpect(status().isOk());
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+copy).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",1,"nome","Alternativa teste","motivo","Modelo arquivado","documento",modelDocument(java.util.List.of()))))).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/workspace/modelador/modelos?projetoObraId="+ownProject()).header("Authorization",token(admin))).andExpect(jsonPath("$.total").value(1));
    }
    @Test void modelEditorRejectsMissingFloorsNegativeDimensionsAndForeignRevisions() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();var wall=modelElement("wall-1","PAREDE");wall.put("largura",-1);
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Medida inválida","documento",modelDocument(java.util.List.of(wall)))))).andExpect(status().isBadRequest());
        wall.put("largura",5);wall.put("pavimentoId","missing");
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Pavimento inválido","documento",modelDocument(java.util.List.of(wall)))))).andExpect(status().isBadRequest());
        Long other=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Outro modelo")).get("id").asLong();Long revision=em.createQuery("select r.id from ModeloRevisaoEntity r where r.modeloId=:id",Long.class).setParameter("id",other).getSingleResult();
        mvc.perform(post("/api/v1/workspace/modelador/modelos/"+id+"/restaurar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"revisaoId",revision,"motivo","Revisão de outro modelo")))).andExpect(status().isNotFound());
    }

    private Map<String,Object> annotatedModel() {
        var wall=modelElement("wall-1","PAREDE");wall.put("x",2);wall.put("largura",4);wall.put("noInicioId","node-a");wall.put("noFimId","node-b");
        var dimension=new java.util.HashMap<String,Object>(Map.of("id","dim-1","pavimentoId","floor-1","tipo","ALINHADA","ax",0,"az",0,"bx",4,"bz",0,"afastamento",-0.4,"noAId","node-a","noBId","node-b"));
        return new java.util.HashMap<>(Map.of("schemaVersao",2,"pavimentos",java.util.List.of(Map.of("id","floor-1","nome","Térreo","cota",0,"altura",2.8)),"elementos",java.util.List.of(wall),"nos",java.util.List.of(Map.of("id","node-a","pavimentoId","floor-1","x",0,"z",0),Map.of("id","node-b","pavimentoId","floor-1","x",4,"z",0)),"cotas",java.util.List.of(dimension),"ambientes",java.util.List.of(Map.of("id","room-label","pavimentoId","floor-1","nome","Identificação teste","x",2,"z",1,"paredeIds",java.util.List.of("wall-1")))));
    }
    @Test void modelAnnotationsAndConnectedNodesPersistAndRestoreWithRevisions() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();modelSave(id,0,annotatedModel());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.documento.schemaVersao").value(2)).andExpect(jsonPath("$.documento.nos.length()").value(2)).andExpect(jsonPath("$.documento.cotas[0].noBId").value("node-b")).andExpect(jsonPath("$.documento.ambientes[0].nome").value("Identificação teste"));
        Long revision=em.createQuery("select r.id from ModeloRevisaoEntity r where r.modeloId=:id and r.numero=2",Long.class).setParameter("id",id).getSingleResult();
        modelSave(id,1,modelDocument(java.util.List.of()));
        mvc.perform(post("/api/v1/workspace/modelador/modelos/"+id+"/restaurar").header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",2,"revisaoId",revision,"motivo","Restaurar planta anotada")))).andExpect(status().isOk()).andExpect(jsonPath("$.documento.cotas.length()").value(1)).andExpect(jsonPath("$.documento.elementos[0].noInicioId").value("node-a"));
    }
    @Test void modelAnnotationValidationRejectsInconsistentGeometryAndDetachedDimensions() throws Exception {
        Long id=create("/modelador/modelos",Map.of("projetoObraId",ownProject(),"nome","Modelo teste")).get("id").asLong();var invalid=json.valueToTree(annotatedModel());((com.fasterxml.jackson.databind.node.ObjectNode)invalid.get("elementos").get(0)).put("largura",8);
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Inválido","documento",invalid)))).andExpect(status().isBadRequest());
        invalid=json.valueToTree(annotatedModel());((com.fasterxml.jackson.databind.node.ObjectNode)invalid.get("cotas").get(0)).put("noAId","missing");
        mvc.perform(put("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin)).contentType("application/json").content(json.writeValueAsString(Map.of("versao",0,"nome","Modelo teste","motivo","Inválido","documento",invalid)))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/workspace/modelador/modelos/"+id).header("Authorization",token(admin))).andExpect(jsonPath("$.revisao").value(1));
    }

    @Test void dataDiagnosisIsScopedAndDoesNotClaimFactualVerification() throws Exception {
        mvc.perform(get("/api/v1/workspace/dados/diagnostico").header("Authorization",token(admin))).andExpect(status().isOk()).andExpect(jsonPath("$.contagens.usuarios").value(2)).andExpect(jsonPath("$.contagens.obras").value(1)).andExpect(jsonPath("$.ambienteDados").value("OPERACAO")).andExpect(jsonPath("$.veracidadeComprovada").value(false));
        mvc.perform(get("/api/v1/workspace/dados/diagnostico").header("Authorization",token(engineer))).andExpect(status().isForbidden());
        var company=em.find(EmpresaEntity.class,admin.getEmpresaId());company.setAmbienteDados("HOMOLOGACAO");em.flush();
        mvc.perform(get("/api/v1/workspace/dados/diagnostico").header("Authorization",token(admin))).andExpect(jsonPath("$.ambienteDados").value("HOMOLOGACAO")).andExpect(jsonPath("$.alertas[0].codigo").value("BASE_DE_TESTE"));
    }
}
