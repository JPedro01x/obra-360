package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.ExclusaoCadastroService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/workspace")
public class ExclusaoCadastroController {
    private final ExclusaoCadastroService service;
    public ExclusaoCadastroController(ExclusaoCadastroService service){this.service=service;}
    @DeleteMapping("/projetos/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public void project(@PathVariable Long id,@Valid @RequestBody Confirmation r,Authentication a){service.project(id,r.confirmacao(),Long.valueOf(a.getName()));}
    @DeleteMapping("/fornecedores/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
    public void supplier(@PathVariable Long id,@Valid @RequestBody Confirmation r,Authentication a){service.supplier(id,r.confirmacao(),Long.valueOf(a.getName()));}
    @DeleteMapping("/equipes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','MESTRE_OBRA')")
    public void team(@PathVariable Long id,@Valid @RequestBody Confirmation r,Authentication a){service.team(id,r.confirmacao(),Long.valueOf(a.getName()));}
    public record Confirmation(@NotBlank @Size(max=255) String confirmacao){}
}
