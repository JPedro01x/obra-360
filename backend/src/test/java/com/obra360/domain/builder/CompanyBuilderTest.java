package com.obra360.domain.builder;

import com.obra360.domain.entity.Company;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários: CompanyBuilder (Builder Pattern)")
class CompanyBuilderTest {

    @Test
    @DisplayName("Deve construir instância válida de Company usando Builder fluente")
    void shouldBuildValidCompany() {
        Company company = CompanyBuilder.aCompany()
                .withName("Construtora Apex LTDA")
                .withCnpj("12.345.678/0001-90")
                .withSegment("Engenharia Civil")
                .withCityState("São Paulo / SP")
                .build();

        assertNotNull(company);
        assertEquals("Construtora Apex LTDA", company.getName());
        assertEquals("12.345.678/0001-90", company.getCnpj());
        assertEquals("Engenharia Civil", company.getSegment());
        assertTrue(company.isVerifiedBadge());
    }
}
