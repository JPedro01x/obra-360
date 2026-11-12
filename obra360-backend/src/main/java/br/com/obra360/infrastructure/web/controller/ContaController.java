package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.*;
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
import org.springframework.http.HttpStatus;
import java.util.Set;

@RestController @RequestMapping("/api/v1/workspace") @RequiredArgsConstructor @Transactional
public class ContaController {
    private final EntityManager em;
    private final PasswordEncoder encoder;
    private final OperacaoService operation;
    private final br.com.obra360.application.service.LicencaService licenca;
    @PutMapping("/minha-senha") @PreAuthorize("isAuthenticated()") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody PasswordRequest r,Authentication a) {
        var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()),LockModeType.PESSIMISTIC_WRITE);
        if(!encoder.matches(r.senhaAtual(),user.getSenhaHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Senha atual incorreta.");
        if(r.novaSenha().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Senha excede o limite em bytes.");
        if(encoder.matches(r.novaSenha(),user.getSenhaHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Escolha uma senha diferente da atual.");
        user.setSenhaHash(encoder.encode(r.novaSenha()));user.setVersaoCredencial(user.getVersaoCredencial()+1);
        user.setExigeTrocaSenha(false);
        operation.audit("ALTERAR_SENHA","usuario",user.getId(),user.getId());
    }
    @PatchMapping("/usuarios/{id}") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UsuarioEntity update(@PathVariable Long id,@Valid @RequestBody UserUpdate r,Authentication a) {
        em.find(EmpresaEntity.class,TenantContext.getCurrentTenant(),LockModeType.PESSIMISTIC_WRITE);
        var user=em.find(UsuarioEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(user==null || !TenantContext.getCurrentTenant().equals(user.getEmpresaId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(!Set.of("SUPER_ADMIN","RH","GERENTE_OBRA","ENGENHEIRO","ARQUITETO","MESTRE_OBRA","ALMOXARIFE","FINANCEIRO","AUDITOR","INCORPORADOR","CLIENTE","FORNECEDOR","CORRETOR","LOCADOR_MAQUINAS","INVESTIDOR","COLABORADOR").contains(r.perfil())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if(user.getId().equals(Long.valueOf(a.getName())) && (!r.ativo() || !r.perfil().equals("SUPER_ADMIN"))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Não é possível remover seu próprio acesso administrativo.");
        if(r.ativo() && !Boolean.TRUE.equals(user.getAtivo()))licenca.user(TenantContext.getCurrentTenant(),false);
        user.setNome(r.nome().trim());user.setEmail(r.email().trim().toLowerCase(java.util.Locale.ROOT));user.setPerfil(r.perfil());user.setAtivo(r.ativo());
        if(r.novaSenha()!=null && !r.novaSenha().isBlank()) {
            if(r.novaSenha().length()<12 || r.novaSenha().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            user.setSenhaHash(encoder.encode(r.novaSenha()));user.setTentativasLoginFalhas(0);user.setBloqueadoAte(null);
        }
        user.setVersaoCredencial(user.getVersaoCredencial()+1);operation.audit("ATUALIZAR_USUARIO","usuario",id,Long.valueOf(a.getName()));return user;
    }
    public record PasswordRequest(@NotBlank @Size(max=200) String senhaAtual,@NotBlank @Size(min=12,max=72) String novaSenha) {}
    public record UserUpdate(@NotBlank @Size(max=100) String nome,@NotBlank @Email @Size(max=120) String email,@NotBlank String perfil,@NotNull Boolean ativo,@Size(max=72) String novaSenha) {}
}
