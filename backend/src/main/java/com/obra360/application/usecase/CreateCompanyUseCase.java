package com.obra360.application.usecase;

import com.obra360.domain.entity.Company;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * CLEAN ARCHITECTURE - APPLICATION / USE CASES LAYER
 * Caso de Uso Assíncrono para Cadastro de Organização Multi-Tenant
 */
@Service
public class CreateCompanyUseCase {

    private static final Logger log = Logger.getLogger(CreateCompanyUseCase.class.getName());

    @Async
    public CompletableFuture<Company> executeAsync(Company newCompany) {
        log.info("Executando Caso de Uso Assíncrono: CreateCompanyUseCase para " + newCompany.getName());
        
        // 1. Executar Regras de Negócio do Domínio (DDD)
        newCompany.validateCnpj();
        
        if (newCompany.getId() == null || newCompany.getId().trim().isEmpty()) {
            newCompany.setId("CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        // Simulação de latência de rede corporativa e gravação assíncrona no banco
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        log.info("Organização cadastrada com sucesso via UseCase: " + newCompany.getId());
        return CompletableFuture.completedFuture(newCompany);
    }
}
