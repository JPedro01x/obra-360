package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class InstalacaoService {
    private final EntityManager em;
    private final PasswordEncoder encoder;
    @org.springframework.beans.factory.annotation.Value("${obra360.setup.enabled:false}")
    private boolean enabled;

    @Transactional(readOnly = true)
    public boolean available() {
        return enabled && em.find(InstalacaoEntity.class, 1L) == null &&
            em.createQuery("select count(u) from UsuarioEntity u", Long.class).getSingleResult() == 0 &&
            em.createQuery("select count(e) from EmpresaEntity e", Long.class).getSingleResult() == 0;
    }

    @Transactional
    public void initialize(String name, String legalName, String cnpj, String admin, String email, String password,String ambienteDados) {
        if(password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A senha excede o limite de 72 bytes.");
        if (!available()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Instalação já configurada.");
        // The fixed primary key serializes concurrent first-install requests;
        // a competing transaction fails atomically without creating an account.
        em.persist(new InstalacaoEntity(1L)); em.flush();
        var company = EmpresaEntity.builder().nomeFantasia(name.trim()).razaoSocial(legalName.trim()).cnpj(cnpj.toUpperCase(java.util.Locale.ROOT)).ambienteDados("HOMOLOGACAO".equals(ambienteDados)?"HOMOLOGACAO":"OPERACAO").build();
        em.persist(company);
        var user = UsuarioEntity.builder().empresaId(company.getId()).nome(admin.trim()).email(email.trim().toLowerCase(java.util.Locale.ROOT))
            .senhaHash(encoder.encode(password)).perfil("SUPER_ADMIN").ativo(true).build();
        em.persist(user);
        em.persist(LogAuditoriaEntity.builder().empresaId(company.getId()).usuarioId(user.getId()).acao("CONFIGURAR_INSTALACAO")
            .entidadeAfetada("empresa").entidadeId(company.getId()).build());
    }
}
