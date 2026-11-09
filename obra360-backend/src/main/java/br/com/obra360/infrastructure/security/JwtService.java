package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.entity.UsuarioEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;

@Service
public class JwtService {
    private final jakarta.persistence.EntityManager em;
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${obra360.jwt.secret}") String secret,
                      @Value("${obra360.jwt.expiration-ms:3600000}") long expirationMs,
                      jakarta.persistence.EntityManager em) {
        this.em = em;
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    @org.springframework.transaction.annotation.Transactional
    public String issue(UsuarioEntity user) {
        Date now = new Date();
        var session = new br.com.obra360.domain.entity.SessaoEntity();
        session.setId(java.util.UUID.randomUUID().toString());
        session.setUsuarioId(user.getId());session.setVersaoCredencial(user.getVersaoCredencial());
        session.setCriadoEm(java.time.OffsetDateTime.now());
        session.setExpiraEm(java.time.OffsetDateTime.ofInstant(new Date(now.getTime()+expirationMs).toInstant(),java.time.ZoneOffset.UTC));
        em.persist(session);
        return Jwts.builder().setId(session.getId()).setSubject(user.getId().toString()).setIssuer("obra360")
            .claim("versao",user.getVersaoCredencial()).setIssuedAt(now).setExpiration(new Date(now.getTime() + expirationMs))
            .signWith(key).compact();
    }

    public String sessionId(String token) {
        return Jwts.parserBuilder().setSigningKey(key).requireIssuer("obra360")
            .build().parseClaimsJws(token).getBody().getId();
    }
    @org.springframework.transaction.annotation.Transactional(readOnly=true)
    public boolean sessionActive(String token, UsuarioEntity user) {
        String id=sessionId(token);
        var session=id==null?null:em.find(br.com.obra360.domain.entity.SessaoEntity.class,id);
        return session!=null && session.getUsuarioId().equals(user.getId()) && session.getRevogadoEm()==null
            && session.getVersaoCredencial()==user.getVersaoCredencial() && session.getExpiraEm().isAfter(java.time.OffsetDateTime.now());
    }

    public Long subject(String token) {
        return Long.valueOf(Jwts.parserBuilder().setSigningKey(key).requireIssuer("obra360")
            .build().parseClaimsJws(token).getBody().getSubject());
    }
    public long credentialVersion(String token) {
        Number version=Jwts.parserBuilder().setSigningKey(key).requireIssuer("obra360").build().parseClaimsJws(token).getBody().get("versao",Number.class);
        return version==null?-1:version.longValue();
    }
}
