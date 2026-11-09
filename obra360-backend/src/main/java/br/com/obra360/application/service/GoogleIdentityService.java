package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.JwtService;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
@Service @RequiredArgsConstructor
public class GoogleIdentityService {
    private final IntegrationConfig config;private final EntityManager em;private final JwtService tokens;private final MfaService mfa;private volatile JwtDecoder decoder;
    public boolean available(){return config.has("GOOGLE_CLIENT_ID");}
    private synchronized JwtDecoder decoder(){
        if(decoder==null){var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(5000);factory.setReadTimeout(5000);
            var verifier=NimbusJwtDecoder.withJwkSetUri(config.endpoint(config.get("GOOGLE_JWKS_URL","https://www.googleapis.com/oauth2/v3/certs")).toString()).jwsAlgorithm(SignatureAlgorithm.RS256).restOperations(new RestTemplate(factory)).build();
            OAuth2TokenValidator<Jwt> audience=jwt->jwt.getAudience().contains(config.get("GOOGLE_CLIENT_ID"))?OAuth2TokenValidatorResult.success():OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
            verifier.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer("https://accounts.google.com"),audience));decoder=verifier;
        }return decoder;
    }
    public Jwt verify(String credential,String nonce){
        config.require(available(),"Login Google");if(nonce==null||!nonce.matches("[A-Za-z0-9_-]{43}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Inicie novamente a autenticação Google.");
        try{Jwt jwt=decoder().decode(credential);String claim=jwt.getClaimAsString("nonce");
            if(claim==null||!MessageDigest.isEqual(nonce.getBytes(StandardCharsets.UTF_8),claim.getBytes(StandardCharsets.UTF_8))||!Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))||jwt.getSubject()==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Identidade Google inválida.");return jwt;
        }catch(JwtException ex){throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Identidade Google inválida.");}
    }
    @Transactional public Map<String,String> login(String credential,String nonce){
        Jwt identity=verify(credential,nonce);var found=em.createQuery("select u from UsuarioEntity u where u.googleSubject=:s",UsuarioEntity.class).setParameter("s",identity.getSubject()).getResultList();
        if(found.isEmpty())throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Entre com sua senha e vincule a conta Google antes de usar este acesso.");
        var user=found.get(0);if(!Boolean.TRUE.equals(user.getAtivo())||(user.getBloqueadoAte()!=null&&user.getBloqueadoAte().isAfter(java.time.OffsetDateTime.now())))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if(mfa.enabled(user.getId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Entre com sua senha e código do autenticador para esta conta.");
        return Map.of("token",tokens.issue(user));
    }
    @Transactional public void link(Long userId,String credential,String nonce){
        Jwt identity=verify(credential,nonce);var user=em.find(UsuarioEntity.class,userId,LockModeType.PESSIMISTIC_WRITE);
        if(!user.getEmail().equalsIgnoreCase(identity.getClaimAsString("email")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use a conta Google com o mesmo e-mail do seu cadastro.");user.setGoogleSubject(identity.getSubject());
        em.persist(LogAuditoriaEntity.builder().empresaId(user.getEmpresaId()).usuarioId(userId).acao("VINCULAR_GOOGLE").entidadeAfetada("usuario").entidadeId(userId).build());
    }
}
