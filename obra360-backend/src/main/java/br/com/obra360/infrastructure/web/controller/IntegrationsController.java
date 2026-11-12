package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1/workspace/integracoes") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','ALMOXARIFE','FINANCEIRO','AUDITOR','INCORPORADOR','MESTRE_OBRA')")
public class IntegrationsController {
    private final AiAssistantService ai;private final SefazConsultaService fiscal;private final PasswordMailSender mail;private final GoogleIdentityService google;
    @GetMapping public Map<String,Object> status(){return Map.of("armazenamento","local","iaConfigurada",ai.available(),"emailConfigurado",mail.available(),"googleConfigurado",google.available(),"sefazConfigurada",fiscal.available(),"observacao","Configurado não significa conexão validada com o provedor.");}
    @PostMapping("/ia") public Map<String,String> ask(@Valid @RequestBody Question r,Authentication a){return Map.of("resposta",ai.ask(Long.valueOf(a.getName()),r.pergunta()));}
    @PostMapping("/sefaz") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ALMOXARIFE','FINANCEIRO')") public Map<String,String> query(@Valid @RequestBody Nfe r){return fiscal.query(r.chave());}
    public record Question(@NotBlank @Size(max=6000) String pergunta,@AssertTrue boolean autorizaEnvio){}
    public record Nfe(@NotBlank @Pattern(regexp="[0-9]{44}") String chave){}
}
