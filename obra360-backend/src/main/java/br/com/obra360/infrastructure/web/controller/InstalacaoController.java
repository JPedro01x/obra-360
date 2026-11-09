package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.InstalacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/instalacao")
@RequiredArgsConstructor
public class InstalacaoController {
    private final InstalacaoService service;
    @GetMapping public Map<String, Object> status() { return Map.of("necessaria", service.available(),"ambientes",java.util.List.of("OPERACAO","HOMOLOGACAO")); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public void setup(@Valid @RequestBody SetupRequest request) {
        service.initialize(request.nomeFantasia(), request.razaoSocial(), request.cnpj(), request.nome(), request.email(), request.senha(),request.ambienteDados());
    }
    public record SetupRequest(@NotBlank @Size(max=150) String nomeFantasia, @NotBlank @Size(max=150) String razaoSocial,
        @NotBlank @Pattern(regexp="[A-Za-z0-9]{12}[0-9]{2}") String cnpj, @NotBlank @Size(max=100) String nome,
        @NotBlank @Email @Size(max=120) String email, @NotBlank @Size(min=12,max=72) String senha,@Pattern(regexp="OPERACAO|HOMOLOGACAO") String ambienteDados) {}
}
