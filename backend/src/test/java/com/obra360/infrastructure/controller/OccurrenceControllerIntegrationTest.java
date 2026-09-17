package com.obra360.infrastructure.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obra360.domain.entity.ConstructionOccurrence;
import com.obra360.infrastructure.persistence.SpringDataOccurrenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.kafka.admin.auto-create=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OccurrenceControllerIntegrationTest {

    @MockBean
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataOccurrenceRepository occurrenceRepository;

    @BeforeEach
    void setUp() {
        occurrenceRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve cadastrar nova ocorrência de canteiro e retornar status 201 Created")
    void shouldCreateNewOccurrenceSuccessfully() throws Exception {
        ConstructionOccurrence occ = new ConstructionOccurrence(
                null,
                "PRJ-001",
                "Ausência de Capacete e EPI no Nível 3 (NR-18)",
                "Segurança NR-18",
                "ALTA",
                "Trabalhador advertido verbalmente. EPI fornecido imediatamente pelo almoxarifado.",
                "Segurança do Trabalho",
                "Engenheiro Marcos"
        );

        mockMvc.perform(post("/api/v1/occurrences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(occ)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.projectId", is("PRJ-001")))
                .andExpect(jsonPath("$.severity", is("ALTA")));
    }

    @Test
    @DisplayName("Deve listar ocorrências filtradas por ID do projeto")
    void shouldGetOccurrencesByProjectId() throws Exception {
        ConstructionOccurrence occ = new ConstructionOccurrence(
                "OCC-501",
                "PRJ-777",
                "Desvio de Nível na Alvenaria",
                "Não Conformidade",
                "MEDIA",
                "Parede fora do esquadro.",
                "Equipe Alvenaria",
                "Mestre Pedro"
        );

        mockMvc.perform(post("/api/v1/occurrences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(occ)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/occurrences/project/PRJ-777"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Desvio de Nível na Alvenaria")));
    }

    @Test
    @DisplayName("Deve resolver ocorrência alterando status para RESOLVIDO")
    void shouldResolveOccurrenceSuccessfully() throws Exception {
        ConstructionOccurrence occ = new ConstructionOccurrence(
                "OCC-999",
                "PRJ-001",
                "Falta de Proteção de Periferia",
                "Segurança NR-18",
                "ALTA",
                "Guardacorpos ausentes.",
                "Técnico de Segurança",
                "Engenheiro Carlos"
        );

        mockMvc.perform(post("/api/v1/occurrences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(occ)))
                .andExpect(status().isCreated());

        Map<String, String> payload = Map.of("resolutionNotes", "Guarda-corpo metálico instalado conforme norma NR-18.");

        mockMvc.perform(put("/api/v1/occurrences/OCC-999/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RESOLVIDO")))
                .andExpect(jsonPath("$.description", containsString("Guarda-corpo metálico instalado")));
    }
}
