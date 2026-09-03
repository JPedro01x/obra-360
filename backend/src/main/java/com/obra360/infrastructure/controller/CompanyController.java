package com.obra360.infrastructure.controller;

import com.obra360.application.dto.CompanyDTO;
import com.obra360.application.usecase.CreateCompanyUseCase;
import com.obra360.domain.entity.Company;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
 * REST Controller Spring Boot para Gestão Multi-Tenant de Organizações
 */
@Tag(name = "Companies API", description = "Endpoints para gerenciamento de Organizações Corporativas Multi-Tenant")
@RestController
@RequestMapping("/companies")
@CrossOrigin(origins = "*")
public class CompanyController {

    private final CreateCompanyUseCase createCompanyUseCase;

    @Autowired
    public CompanyController(CreateCompanyUseCase createCompanyUseCase) {
        this.createCompanyUseCase = createCompanyUseCase;
    }

    @Operation(summary = "Listar Organizações Corporativas", description = "Retorna a lista de empresas ativas no ecossistema Multi-Tenant")
    @ApiResponse(responseCode = "200", description = "Organizações listadas com sucesso")
    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies() {
        List<Company> mockList = new ArrayList<>();
        mockList.add(new Company("CMP-001", "Construtora Apex & Engenharia LTDA", "12.345.678/0001-90", "Construtora / Empreiteira", "Enterprise Multi-Tenant", true, 4, 42, "São Paulo / SP", "(11) 3040-5000"));
        mockList.add(new Company("CMP-002", "Silva & Associados Arquitetura & Projetos BIM", "98.765.432/0001-10", "Escritório de Arquitetura", "Parceiro B2B Homologado", true, 6, 15, "São Paulo / SP", "(11) 3210-9900"));
        mockList.add(new Company("CMP-003", "Votoran & Gerdau Suprimentos B2B", "45.112.334/0001-55", "Fornecedor B2B Insumos", "Parceiro B2B Homologado", true, 12, 120, "Sorocaba / SP", "(15) 2101-8800"));
        return ResponseEntity.ok(mockList);
    }

    @Operation(summary = "Cadastrar Organização Corporativa", description = "Cadastra uma nova empresa no ecossistema de forma assíncrona")
    @ApiResponse(responseCode = "201", description = "Empresa criada com sucesso")
    @PostMapping
    public CompletableFuture<ResponseEntity<Company>> createCompany(@Valid @RequestBody CompanyDTO dto) {
        Company newCompany = new Company(
                dto.id() != null ? dto.id() : "CMP-" + System.currentTimeMillis(),
                dto.name(), dto.cnpj(), dto.segment(),
                dto.plan() != null ? dto.plan() : "Parceiro B2B Homologado",
                true, dto.activeProjectsCount(), dto.membersCount(), dto.cityState(), dto.phone()
        );

        return createCompanyUseCase.executeAsync(newCompany)
                .thenApply(created -> ResponseEntity.status(HttpStatus.CREATED).body(created));
    }
}
