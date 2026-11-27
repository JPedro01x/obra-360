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
    private final OperacaoService operation;
    private final IntegrationIdempotencyService idempotency;
    @GetMapping public Map<String,Object> status(){return Map.of("armazenamento","local","iaConfigurada",ai.available(),"emailConfigurado",mail.available(),"googleConfigurado",google.available(),"sefazConfigurada",fiscal.available(),"observacao","Configurado não significa conexão validada com o provedor.");}
    @PostMapping("/ia") public Map<String,String> ask(@RequestHeader("X-Idempotency-Key") String key,@Valid @RequestBody Question r,Authentication a){
        Long actor=Long.valueOf(a.getName());idempotency.claim("IA",key,r.pergunta(),actor);operation.audit("TENTATIVA_CONSULTA_IA","integracao_ia",null,actor);
        String response;
        try {response=ai.ask(actor,r.pergunta());}
        catch(RuntimeException ex){idempotency.finish("IA",key,actor,"FALHA");operation.audit("FALHA_CONSULTA_IA","integracao_ia",null,actor);throw ex;}
        idempotency.finish("IA",key,actor,"CONCLUIDA");operation.audit("RESPOSTA_CONSULTA_IA","integracao_ia",null,actor);return Map.of("resposta",response);
    }
    @PostMapping("/sefaz") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ALMOXARIFE','FINANCEIRO')") public Map<String,String> query(@RequestHeader("X-Idempotency-Key") String idempotencyKey,@Valid @RequestBody Nfe r,Authentication a){
        Long actor=Long.valueOf(a.getName());idempotency.claim("SEFAZ",idempotencyKey,r.chave(),actor);operation.audit("TENTATIVA_CONSULTA_SEFAZ","integracao_sefaz",null,actor);
        Map<String,String> response;
        try {response=fiscal.query(r.chave());}
        catch(RuntimeException ex){idempotency.finish("SEFAZ",idempotencyKey,actor,"FALHA");operation.audit("FALHA_CONSULTA_SEFAZ","integracao_sefaz",null,actor);throw ex;}
        idempotency.finish("SEFAZ",idempotencyKey,actor,"CONCLUIDA");operation.audit("RESPOSTA_CONSULTA_SEFAZ","integracao_sefaz",null,actor);return response;
    }
    public record Question(@NotBlank @Size(max=6000) String pergunta,@AssertTrue boolean autorizaEnvio){}
    public record Nfe(@NotBlank @Pattern(regexp="[0-9]{44}") String chave){}
}
