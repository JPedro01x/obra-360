package com.obra360.infrastructure.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obra360.application.dto.AuthDTOs;
import com.obra360.infrastructure.persistence.SpringDataUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;

@SpringBootTest(properties = {
    "spring.kafka.admin.auto-create=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @MockBean
    private KafkaTemplate<String, String> kafkaTemplate;


    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataUserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve registrar novo usuário corporativo e retornar Bearer Token JWT")
    void shouldRegisterUserSuccessfully() throws Exception {
        AuthDTOs.RegisterRequestDTO request = new AuthDTOs.RegisterRequestDTO(
                "João Pedro Engenheiro",
                "joao.pedro@obra360.com.br",
                "SenhaSegura123",
                "ENGENHEIRO",
                "CMP-001",
                "https://avatar.url"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("joao.pedro@obra360.com.br")))
                .andExpect(jsonPath("$.role", is("ENGENHEIRO")))
                .andExpect(jsonPath("$.companyId", is("CMP-001")));
    }

    @Test
    @DisplayName("Deve realizar login com e-mail e senha corretos e retornar Token JWT válido")
    void shouldLoginSuccessfully() throws Exception {
        // First register
        AuthDTOs.RegisterRequestDTO registerReq = new AuthDTOs.RegisterRequestDTO(
                "Marcos Henrique",
                "marcos@obra360.com.br",
                "SenhaForte456",
                "SUPER_ADMIN",
                "CMP-001",
                null
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Then login
        AuthDTOs.LoginRequestDTO loginReq = new AuthDTOs.LoginRequestDTO(
                "marcos@obra360.com.br",
                "SenhaForte456"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("marcos@obra360.com.br")))
                .andExpect(jsonPath("$.role", is("SUPER_ADMIN")));
    }

    @Test
    @DisplayName("Deve rejeitar login com senha incorreta")
    void shouldRejectLoginWithWrongPassword() throws Exception {
        AuthDTOs.RegisterRequestDTO registerReq = new AuthDTOs.RegisterRequestDTO(
                "Usuário Teste",
                "teste@obra360.com.br",
                "SenhaCorreta123",
                "ALMOXARIFE",
                "CMP-001",
                null
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        AuthDTOs.LoginRequestDTO loginReq = new AuthDTOs.LoginRequestDTO(
                "teste@obra360.com.br",
                "SenhaErrada999"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }
}
