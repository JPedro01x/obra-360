package com.obra360.infrastructure.controller;

import com.obra360.application.usecase.CreateCompanyUseCase;
import com.obra360.domain.entity.Company;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CompanyController.class)
@DisplayName("Testes de Integração de API (Spring WebMvcTest MockMvc)")
class CompanyControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CreateCompanyUseCase createCompanyUseCase;

    @Test
    @DisplayName("Deve retornar status 200 OK e lista de organizações corporativas")
    void shouldReturnCompaniesList() throws Exception {
        mockMvc.perform(get("/companies")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Construtora Apex & Engenharia LTDA"));
    }

    @Test
    @DisplayName("Deve cadastrar nova organização corporativa via POST /companies")
    void shouldCreateNewCompany() throws Exception {
        Company mockCreatedCompany = new Company(
                "CMP-999", "Engenharia & Soluções LTDA", "99.888.777/0001-11",
                "Construtora / Empreiteira", "Enterprise Multi-Tenant", true, 2, 10, "Recife / PE", "(81) 3456-7890"
        );

        Mockito.when(createCompanyUseCase.executeAsync(any(Company.class)))
                .thenReturn(CompletableFuture.completedFuture(mockCreatedCompany));

        String companyJson = """
                {
                    "name": "Engenharia & Soluções LTDA",
                    "cnpj": "99.888.777/0001-11",
                    "segment": "Construtora / Empreiteira",
                    "plan": "Enterprise Multi-Tenant",
                    "verifiedBadge": true,
                    "activeProjectsCount": 2,
                    "membersCount": 10,
                    "cityState": "Recife / PE",
                    "phone": "(81) 3456-7890"
                }
                """;

        mockMvc.perform(post("/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(companyJson))
                .andExpect(request().asyncStarted());
    }
}
