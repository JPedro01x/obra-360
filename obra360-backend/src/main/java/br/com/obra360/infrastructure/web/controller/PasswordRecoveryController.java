package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.PasswordRecoveryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
@RestController @RequestMapping("/api/v1/auth") @RequiredArgsConstructor
public class PasswordRecoveryController {
    private final PasswordRecoveryService service;
    @PostMapping("/recuperar") @ResponseStatus(HttpStatus.ACCEPTED) public void request(@Valid @RequestBody EmailRequest r){service.request(r.email());}
    @PostMapping("/redefinir") @ResponseStatus(HttpStatus.NO_CONTENT) public void reset(@Valid @RequestBody ResetRequest r){service.reset(r.token(),r.senha());}
    public record EmailRequest(@NotBlank @Email @Size(max=120) String email){}
    public record ResetRequest(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") String token,@NotBlank @Size(min=12,max=72) String senha){}
}
