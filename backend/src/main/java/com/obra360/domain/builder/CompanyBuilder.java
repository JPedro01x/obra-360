package com.obra360.domain.builder;

import com.obra360.domain.entity.Company;

/**
 * GOF DESIGN PATTERN: BUILDER PATTERN
 * Construtor fluente e seguro para inicializar agregações de Organizações Corporativas Multi-Tenant
 */
public class CompanyBuilder {

    private String id;
    private String name;
    private String cnpj;
    private String segment = "Construtora / Empreiteira";
    private String plan = "Enterprise Multi-Tenant";
    private boolean verifiedBadge = true;
    private int activeProjectsCount = 0;
    private int membersCount = 1;
    private String cityState = "São Paulo / SP";
    private String phone = "(11) 3000-0000";

    public static CompanyBuilder aCompany() {
        return new CompanyBuilder();
    }

    public CompanyBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public CompanyBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public CompanyBuilder withCnpj(String cnpj) {
        this.cnpj = cnpj;
        return this;
    }

    public CompanyBuilder withSegment(String segment) {
        this.segment = segment;
        return this;
    }

    public CompanyBuilder withPlan(String plan) {
        this.plan = plan;
        return this;
    }

    public CompanyBuilder withCityState(String cityState) {
        this.cityState = cityState;
        return this;
    }

    public CompanyBuilder withPhone(String phone) {
        this.phone = phone;
        return this;
    }

    public Company build() {
        if (id == null) {
            id = "CMP-" + System.currentTimeMillis();
        }
        return new Company(
                id, name, cnpj, segment, plan, verifiedBadge,
                activeProjectsCount, membersCount, cityState, phone
        );
    }
}
