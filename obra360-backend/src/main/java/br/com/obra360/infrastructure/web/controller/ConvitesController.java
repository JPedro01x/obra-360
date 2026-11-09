package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.domain.entity.*;
import br.com.obra360.application.service.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.*;
import java.time.OffsetDateTime;
import java.util.*;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor @Transactional
public class ConvitesController {
    private final EntityManager em;private final PasswordEncoder encoder;private final OperacaoService operation;
    private final LicencaService licenca;
    private static final Set<String> ROLES=Set.of("SUPER_ADMIN","RH","GERENTE_OBRA","ENGENHEIRO","ARQUITETO","MESTRE_OBRA","ALMOXARIFE","FINANCEIRO","AUDITOR","INCORPORADOR","CLIENTE","FORNECEDOR","CORRETOR","LOCADOR_MAQUINAS","INVESTIDOR");
    @GetMapping("/workspace/convites") @PreAuthorize("hasRole('SUPER_ADMIN')") @Transactional(readOnly=true)
    public List<Map<String,Object>> list(){return em.createQuery("select c from ConviteEntity c where c.empresaId=:t order by c.criadoEm desc",ConviteEntity.class).setParameter("t",TenantContext.getCurrentTenant()).setMaxResults(100).getResultList().stream().map(c->Map.<String,Object>of("id",c.getId(),"email",c.getEmail(),"perfil",c.getPerfil(),"expiraEm",c.getExpiraEm(),"usado",c.isUsado(),"revogado",c.isRevogado())).toList();}
    @PostMapping("/workspace/convites") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String,String>> create(@Valid @RequestBody NovoConvite r,Authentication a){
        licenca.user(TenantContext.getCurrentTenant(),false);
        em.find(EmpresaEntity.class,TenantContext.getCurrentTenant(),LockModeType.PESSIMISTIC_WRITE);
        if(!ROLES.contains(r.perfil()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        String email=r.email().trim().toLowerCase(Locale.ROOT);
        if(em.createQuery("select count(u) from UsuarioEntity u where lower(u.email)=:e",Long.class).setParameter("e",email).getSingleResult()>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail indisponível para um novo convite.");
        var active=em.createQuery("select c from ConviteEntity c where c.empresaId=:t and c.usado=false and c.revogado=false and c.expiraEm>:now",ConviteEntity.class).setParameter("t",TenantContext.getCurrentTenant()).setParameter("now",OffsetDateTime.now()).getResultList();
        if(active.size()>=20||active.stream().anyMatch(c->c.getEmail().equals(email)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Já há convite ativo para este e-mail ou o limite de 20 convites foi atingido.");
        byte[] bytes=new byte[32];new java.security.SecureRandom().nextBytes(bytes);String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var c=new ConviteEntity();c.setId(UUID.randomUUID().toString());c.setTokenHash(PasswordRecoveryService.hash(raw));c.setEmpresaId(TenantContext.getCurrentTenant());c.setEmail(email);c.setPerfil(r.perfil());c.setCriadoEm(OffsetDateTime.now());c.setExpiraEm(c.getCriadoEm().plusHours(48));em.persist(c);
        operation.audit("CRIAR_CONVITE","empresa",c.getEmpresaId(),Long.valueOf(a.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore()).body(Map.of("id",c.getId(),"token",raw));
    }
    @DeleteMapping("/workspace/convites/{id}") @PreAuthorize("hasRole('SUPER_ADMIN')") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable String id,Authentication a){var c=em.find(ConviteEntity.class,id,LockModeType.PESSIMISTIC_WRITE);if(c==null||!c.getEmpresaId().equals(TenantContext.getCurrentTenant()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);c.setRevogado(true);operation.audit("REVOGAR_CONVITE","empresa",c.getEmpresaId(),Long.valueOf(a.getName()));}
    @PostMapping("/auth/aceitar-convite") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@Valid @RequestBody Aceitar r){
        var matches=em.createQuery("select c from ConviteEntity c where c.tokenHash=:h",ConviteEntity.class).setParameter("h",PasswordRecoveryService.hash(r.token())).getResultList();
        if(matches.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Convite inválido ou expirado.");var c=matches.get(0);
        licenca.user(c.getEmpresaId(),true);
        em.refresh(c,LockModeType.PESSIMISTIC_WRITE);
        if(c.isUsado()||c.isRevogado()||!c.getExpiraEm().isAfter(OffsetDateTime.now()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Convite inválido ou expirado.");
        if(r.senha().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Senha excede o limite em bytes.");
        var u=UsuarioEntity.builder().empresaId(c.getEmpresaId()).email(c.getEmail()).nome(r.nome().trim()).senhaHash(encoder.encode(r.senha())).perfil(c.getPerfil()).ativo(true).build();em.persist(u);c.setUsado(true);em.flush();
        em.persist(LogAuditoriaEntity.builder().empresaId(c.getEmpresaId()).usuarioId(u.getId()).acao("ACEITAR_CONVITE").entidadeAfetada("usuario").entidadeId(u.getId()).build());
    }
    public record NovoConvite(@NotBlank @Email @Size(max=120) String email,@NotBlank String perfil){}
    public record Aceitar(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{43}") String token,@NotBlank @Size(max=100) String nome,@NotBlank @Size(min=12,max=72) String senha){}
}
