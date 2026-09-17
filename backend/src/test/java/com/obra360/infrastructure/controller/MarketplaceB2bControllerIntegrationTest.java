package com.obra360.infrastructure.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obra360.domain.entity.B2bMaterialRFQ;
import com.obra360.infrastructure.persistence.SpringDataB2bRfqRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.kafka.admin.auto-create=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceB2bControllerIntegrationTest {

    @MockBean
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataB2bRfqRepository rfqRepository;

    @BeforeEach
    void setUp() {
        rfqRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve cadastrar nova cotação B2B RFQ e retornar status 201 Created")
    void shouldCreateNewRfqSuccessfully() throws Exception {
        B2bMaterialRFQ rfq = new B2bMaterialRFQ(
                null,
                "Tijolo Baiano 9x19x19 - Lote 10.000 un",
                "Mestre Silva",
                "Alvenaria & Vedações",
                10000,
                "Unidades",
                null,
                0.0
        );

        mockMvc.perform(post("/api/v1/marketplace/rfq")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Tijolo Baiano 9x19x19 - Lote 10.000 un")))
                .andExpect(jsonPath("$.status", is("ABERTA")));
    }

    @Test
    @DisplayName("Deve listar cotações RFQ persistidas no banco de dados")
    void shouldListAllRfqs() throws Exception {
        B2bMaterialRFQ rfq = new B2bMaterialRFQ(
                "RFQ-TEST-01",
                "Tinta Acrílica Branca 18L",
                "Engenheiro João",
                "Acabamento",
                50,
                "Latas",
                "Coral Tintas",
                18500.00
        );

        mockMvc.perform(post("/api/v1/marketplace/rfq")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfq)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/marketplace/rfq"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Tinta Acrílica Branca 18L")));
    }

    @Test
    @DisplayName("Deve submeter proposta de fornecedor e atualizar melhor preço na RFQ")
    void shouldSubmitSupplierQuoteSuccessfully() throws Exception {
        B2bMaterialRFQ rfq = new B2bMaterialRFQ(
                "RFQ-999",
                "Cimento Votoran 50kg",
                "Carlos",
                "Estrutural",
                100,
                "Sacos",
                "Vendedor A",
                4500.00
        );

        mockMvc.perform(post("/api/v1/marketplace/rfq")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfq)))
                .andExpect(status().isCreated());

        MarketplaceB2bController.SupplierQuoteRequest quoteRequest =
                new MarketplaceB2bController.SupplierQuoteRequest("Fornecedor Gerdau B2B", 3900.00);

        mockMvc.perform(post("/api/v1/marketplace/rfq/RFQ-999/quote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bestQuoteSupplier", is("Fornecedor Gerdau B2B")))
                .andExpect(jsonPath("$.bestQuotePrice", is(3900.00)));
    }

    @Test
    @DisplayName("Deve validar chave NFe de 44 dígitos com sucesso via algoritmo Módulo 11 da SEFAZ")
    void shouldValidateNfeKeySuccessfully() throws Exception {
        String valid44DigitNfe = "35260912345678000195550010000001011234567890";
        Map<String, String> payload = Map.of("nfeKey", valid44DigitNfe);

        mockMvc.perform(post("/api/v1/marketplace/verify-nfe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.nfeKey", is(valid44DigitNfe)));
    }
}
