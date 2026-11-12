package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.util.*;

@Service @Transactional
public class AcessoFuncionarioService {
    private final EntityManager em;
    private final PasswordEncoder encoder;
    private final LicencaService licenses;
    private final OperacaoService operations;
    public AcessoFuncionarioService(EntityManager em,PasswordEncoder encoder,LicencaService licenses,OperacaoService operations) {
        this.em=em;this.encoder=encoder;this.licenses=licenses;this.operations=operations;
    }
    // Kept only in the response of the transaction that creates the account.
    public record InitialAccess(Long usuarioId,String email,String senha,String perfil) {}
    public record Provision(UsuarioEntity user,InitialAccess initial) {}
    public Provision provision(Long existingId,Long employeeId,String name,String email,Long actor) {
        Long company=TenantContext.getCurrentTenant();
        if(existingId!=null) {
            var user=em.find(UsuarioEntity.class,existingId,LockModeType.PESSIMISTIC_WRITE);
            var employee=employeeId==null?null:em.find(RhFuncionarioEntity.class,employeeId);
            boolean retained=employee!=null && existingId.equals(employee.getUsuarioId());
            if(user==null || !company.equals(user.getEmpresaId()) || (!retained && !Boolean.TRUE.equals(user.getAtivo())))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Conta ativa não encontrada nesta empresa.");
            var administrator=operations.member(actor);
            if(!retained && !"SUPER_ADMIN".equals(administrator.getPerfil()) && !"COLABORADOR".equals(user.getPerfil()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Somente o administrador pode vincular contas com acesso de gestão.");
            if(Set.of("CLIENTE","FORNECEDOR","CORRETOR","LOCADOR_MAQUINAS","INVESTIDOR").contains(user.getPerfil()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vincule uma conta interna ao funcionário.");
            var count=em.createQuery("select count(f) from RhFuncionarioEntity f where f.usuarioId=:u"+(employeeId==null?"":" and f.id<>:id"),Long.class).setParameter("u",existingId);
            if(employeeId!=null) count.setParameter("id",employeeId);
            long linked=count.getSingleResult();
            if(linked>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Esta conta já está vinculada a outro funcionário.");
            return new Provision(user,null);
        }
        if(email==null || !email.trim().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe o e-mail do funcionário para criar o login.");
        String login=email.trim().toLowerCase(Locale.ROOT);
        licenses.user(company,false);
        if(em.createQuery("select count(u) from UsuarioEntity u where lower(u.email)=:email",Long.class).setParameter("email",login).getSingleResult()>0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já utilizado. Vincule a conta existente ou informe outro e-mail.");
        byte[] bytes=new byte[18];new SecureRandom().nextBytes(bytes);
        String password="Aa1!"+Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var user=UsuarioEntity.builder().empresaId(company).nome(name.trim().substring(0,Math.min(name.trim().length(),100)))
            .email(login).perfil("COLABORADOR").ativo(true).senhaHash(encoder.encode(password)).exigeTrocaSenha(true).build();
        em.persist(user);operations.audit("RH_CRIAR_ACESSO","usuario",user.getId(),actor);
        return new Provision(user,new InitialAccess(user.getId(),login,password,user.getPerfil()));
    }
    public void deactivate(RhFuncionarioEntity employee,Long actor) {
        if(employee.getUsuarioId()==null) return;
        var user=em.find(UsuarioEntity.class,employee.getUsuarioId(),LockModeType.PESSIMISTIC_WRITE);
        if(user==null || !employee.getEmpresaId().equals(user.getEmpresaId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Vínculo de acesso inconsistente.");
        if(actor.equals(user.getId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Outro administrador deve registrar seu desligamento.");
        if(!"COLABORADOR".equals(user.getPerfil()) && !"SUPER_ADMIN".equals(operations.member(actor).getPerfil()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"O administrador deve desligar funcionários com acesso de gestão.");
        user.setAtivo(false);user.setVersaoCredencial(user.getVersaoCredencial()+1);
        operations.audit("RH_DESATIVAR_ACESSO","usuario",user.getId(),actor);
    }
}
