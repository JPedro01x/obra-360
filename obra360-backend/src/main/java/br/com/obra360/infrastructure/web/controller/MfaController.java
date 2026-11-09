package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.MfaService;
import br.com.obra360.domain.entity.UsuarioEntity;
import br.com.obra360.infrastructure.security.BruteForceProtectionService;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/mfa") @RequiredArgsConstructor @PreAuthorize("isAuthenticated()")
public class MfaController {
    private final MfaService mfa;
    private final EntityManager em;
    private final PasswordEncoder encoder;
    private final BruteForceProtectionService brute;
    @GetMapping public Map<String,Boolean> status(Authentication a){return Map.of("disponivel",mfa.available(),"ativo",mfa.enabled(Long.valueOf(a.getName())));}
    @PostMapping("/preparar") public ResponseEntity<Map<String,String>> prepare(@Valid @RequestBody Proof r,Authentication a,HttpServletRequest request){
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(mfa.prepare(reauth(r,a,request)));
    }
    @PostMapping("/ativar") public ResponseEntity<Map<String,List<String>>> activate(@Valid @RequestBody Proof r,Authentication a,HttpServletRequest request){
        var user=reauth(r,a,request);try{return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("codigosRecuperacao",mfa.activate(user.getId(),r.codigo())));}
        catch(ResponseStatusException e){brute.registrarFalhaLogin(request.getRemoteAddr());throw e;}
    }
    @PostMapping("/desativar") @ResponseStatus(HttpStatus.NO_CONTENT) public void disable(@Valid @RequestBody Proof r,Authentication a,HttpServletRequest request){
        var user=reauth(r,a,request);try{mfa.disable(user.getId(),r.codigo());}catch(ResponseStatusException e){brute.registrarFalhaLogin(request.getRemoteAddr());throw e;}
    }
    private UsuarioEntity reauth(Proof r,Authentication a,HttpServletRequest request){
        if(brute.isIpBloqueado(request.getRemoteAddr()))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()));
        if(!encoder.matches(r.senha(),user.getSenhaHash())){brute.registrarFalhaLogin(request.getRemoteAddr());throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Senha atual incorreta.");}return user;
    }
    public record Proof(@NotBlank @Size(max=200) String senha,@Size(max=64) String codigo){}
}
