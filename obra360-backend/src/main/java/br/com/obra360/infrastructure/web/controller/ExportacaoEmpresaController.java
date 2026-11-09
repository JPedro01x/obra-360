package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.*;
import br.com.obra360.domain.entity.UsuarioEntity;
import br.com.obra360.infrastructure.security.*;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequiredArgsConstructor
public class ExportacaoEmpresaController {
    private final ExportacaoEmpresaService exporter;private final EntityManager em;private final PasswordEncoder encoder;
    private final MfaService mfa;private final BruteForceProtectionService brute;private final OperacaoService operation;
    @PostMapping("/api/v1/workspace/exportar") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<byte[]> export(@Valid @RequestBody Proof r,Authentication a,HttpServletRequest request)throws java.io.IOException{
        if(brute.isIpBloqueado(request.getRemoteAddr()))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()));
        if(!encoder.matches(r.senha(),user.getSenhaHash())||!mfa.verify(user.getId(),r.codigo())){brute.registrarFalhaLogin(request.getRemoteAddr());throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Confira sua senha e o código de autenticação.");}
        var bytes=exporter.export(TenantContext.getCurrentTenant());operation.audit("EXPORTAR_EMPRESA","empresa",TenantContext.getCurrentTenant(),user.getId());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/zip")).cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=obra360-empresa.zip").body(bytes);
    }
    public record Proof(@NotBlank @Size(max=200) String senha,@Size(max=64) String codigo){}
}
