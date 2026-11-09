package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.security.SecureRandom;
import java.util.*;
@RestController @RequiredArgsConstructor
public class GoogleIdentityController {
    private final GoogleIdentityService google;private final PasswordMailSender mail;private final IntegrationConfig config;
    @GetMapping("/api/v1/auth/configuracao") public Map<String,Object> configuration(){return Map.of("googleClientId",google.available()?config.get("GOOGLE_CLIENT_ID"):"","emailRecovery",mail.available());}
    @GetMapping("/api/v1/auth/google/nonce") public Map<String,String> challenge(HttpServletRequest request,HttpServletResponse response){config.require(google.available(),"Login Google");byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String nonce=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);cookie(request,response,nonce,300);return Map.of("nonce",nonce);}
    @PostMapping("/api/v1/auth/google") public Map<String,String> login(@Valid @RequestBody Credential r,@CookieValue(name="obra360_google_nonce",required=false) String nonce,HttpServletRequest request,HttpServletResponse response){var result=google.login(r.credential(),nonce);cookie(request,response,"",0);return result;}
    @PostMapping("/api/v1/workspace/google/vincular") @ResponseStatus(HttpStatus.NO_CONTENT) public void link(@Valid @RequestBody Credential r,@CookieValue(name="obra360_google_nonce",required=false) String nonce,Authentication a,HttpServletRequest request,HttpServletResponse response){google.link(Long.valueOf(a.getName()),r.credential(),nonce);cookie(request,response,"",0);}
    private void cookie(HttpServletRequest request,HttpServletResponse response,String value,int seconds){response.addHeader(HttpHeaders.SET_COOKIE,ResponseCookie.from("obra360_google_nonce",value).httpOnly(true).secure(request.isSecure()||config.get("APP_PUBLIC_URL").startsWith("https://")).sameSite("Strict").path("/api").maxAge(seconds).build().toString());}
    public record Credential(@NotBlank @Size(max=12000) String credential){}
}
