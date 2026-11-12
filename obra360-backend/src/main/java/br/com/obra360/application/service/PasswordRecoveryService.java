package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.domain.repository.UsuarioRepository;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;

@Service @RequiredArgsConstructor @Slf4j
public class PasswordRecoveryService {
    private final EntityManager em;private final UsuarioRepository users;private final PasswordEncoder encoder;private final PasswordMailSender mail;private final IntegrationConfig config;
    private final ThreadPoolExecutor executor=new ThreadPoolExecutor(1,2,30,TimeUnit.SECONDS,new ArrayBlockingQueue<>(100),r->{Thread t=new Thread(r,"password-email");t.setDaemon(true);return t;});
    @PreDestroy void shutdown(){executor.shutdown();}
    public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException ex){throw new IllegalStateException(ex);}}
    @Transactional public void request(String email){
        config.require(mail.available(),"Recuperação por e-mail");
        var uri=config.endpoint(config.get("APP_PUBLIC_URL"));if(uri.getFragment()!=null||uri.getQuery()!=null)throw new IllegalArgumentException("APP_PUBLIC_URL deve ser uma URL base sem parâmetros.");
        var found=users.findByEmailIgnoreCase(email.trim());if(found.isEmpty()||!Boolean.TRUE.equals(found.get().getAtivo()))return;
        var user=found.get();em.lock(user,LockModeType.PESSIMISTIC_WRITE);OffsetDateTime now=OffsetDateTime.now();
        if(em.createQuery("select count(r) from PasswordResetEntity r where r.usuarioId=:u and r.criadoEm>:cutoff",Long.class).setParameter("u",user.getId()).setParameter("cutoff",now.minusMinutes(1)).getSingleResult()>0)return;
        byte[] random=new byte[32];new SecureRandom().nextBytes(random);String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        em.createQuery("update PasswordResetEntity r set r.usado=true where r.usuarioId=:u").setParameter("u",user.getId()).executeUpdate();
        em.persist(PasswordResetEntity.builder().tokenHash(hash(raw)).usuarioId(user.getId()).criadoEm(now).expiraEm(now.plusMinutes(15)).usado(false).build());
        String base=config.get("APP_PUBLIC_URL").replaceAll("/+$","");String recipient=user.getEmail(),link=base+"/#recuperar="+raw;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){try{executor.execute(()->{try{mail.send(recipient,link);}catch(Exception ex){log.error("Falha no envio de recuperação de senha; verifique o serviço SMTP.");}});}catch(RejectedExecutionException ex){log.error("Fila de recuperação de senha cheia.");}}});
    }
    @Transactional public void reset(String raw,String password){
        if(password.length()<12||password.getBytes(StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A senha deve ter 12 caracteres e no máximo 72 bytes.");
        var token=em.find(PasswordResetEntity.class,hash(raw));if(token==null)throw invalid();
        var user=em.find(UsuarioEntity.class,token.getUsuarioId(),LockModeType.PESSIMISTIC_WRITE);em.refresh(token,LockModeType.PESSIMISTIC_WRITE);
        if(token.isUsado()||token.getExpiraEm().isBefore(OffsetDateTime.now())||!Boolean.TRUE.equals(user.getAtivo()))throw invalid();
        user.setSenhaHash(encoder.encode(password));user.setVersaoCredencial(user.getVersaoCredencial()+1);user.setBloqueadoAte(null);user.setTentativasLoginFalhas(0);
        user.setExigeTrocaSenha(false);
        em.createQuery("update PasswordResetEntity r set r.usado=true where r.usuarioId=:u").setParameter("u",user.getId()).executeUpdate();
        em.persist(LogAuditoriaEntity.builder().empresaId(user.getEmpresaId()).usuarioId(user.getId()).acao("RECUPERAR_SENHA").entidadeAfetada("usuario").entidadeId(user.getId()).build());
    }
    private ResponseStatusException invalid(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Link inválido, utilizado ou expirado. Solicite uma nova recuperação.");}
}
