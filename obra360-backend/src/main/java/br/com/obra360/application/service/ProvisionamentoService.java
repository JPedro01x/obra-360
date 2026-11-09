package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/** Operator-only CLI calls this service; it is never exposed by a tenant HTTP API. */
@Service @RequiredArgsConstructor
public class ProvisionamentoService {
    private final EntityManager em;private final PasswordEncoder encoder;
    @Transactional public Long create(String name,String legal,String cnpj,String admin,String email,String password,String environment,int users,int projects,int models){
        valid(name,150);valid(legal,150);valid(admin,100);
        if(cnpj==null||!cnpj.matches("[A-Za-z0-9]{14}")||email==null||email.length()>120||!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")||password==null||password.length()<12||password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72||!java.util.Set.of("OPERACAO","HOMOLOGACAO").contains(environment))throw new IllegalArgumentException("Dados de provisionamento inválidos. Confira o arquivo de operação.");
        bounds(users,projects,models);
        var c=EmpresaEntity.builder().nomeFantasia(name.trim()).razaoSocial(legal.trim()).cnpj(cnpj.toUpperCase(java.util.Locale.ROOT)).ambienteDados(environment).build();em.persist(c);
        var u=UsuarioEntity.builder().empresaId(c.getId()).nome(admin.trim()).email(email.trim().toLowerCase(java.util.Locale.ROOT)).senhaHash(encoder.encode(password)).perfil("SUPER_ADMIN").ativo(true).build();em.persist(u);
        license(c.getId(),users,projects,models,"MANUAL");
        em.persist(LogAuditoriaEntity.builder().empresaId(c.getId()).usuarioId(u.getId()).acao("PROVISIONAR_EMPRESA").entidadeAfetada("empresa").entidadeId(c.getId()).build());return c.getId();
    }
    @Transactional public void license(Long tenant,int users,int projects,int models,String plan){
        bounds(users,projects,models);valid(plan,40);
        if(em.find(EmpresaEntity.class,tenant,LockModeType.PESSIMISTIC_WRITE)==null)throw new IllegalArgumentException("Empresa inexistente.");
        var l=em.find(LicencaEmpresaEntity.class,tenant);if(l==null){l=new LicencaEmpresaEntity();l.setEmpresaId(tenant);em.persist(l);}
        l.setPlano(plan.trim());l.setLimiteUsuarios(users);l.setLimiteProjetos(projects);l.setLimiteModelos(models);em.flush();
        em.persist(LogAuditoriaEntity.builder().empresaId(tenant).acao("OPERADOR_AJUSTAR_LIMITES").entidadeAfetada("licenca_empresa").entidadeId(tenant).build());
    }
    private void bounds(int u,int p,int m){if(u<1||u>100000||p<1||p>100000||m<1||m>1000000)throw new IllegalArgumentException("Limites fora do intervalo permitido.");}
    private void valid(String s,int max){if(s==null||s.isBlank()||s.length()>max)throw new IllegalArgumentException("Campo obrigatório ausente ou excedido.");}
}
