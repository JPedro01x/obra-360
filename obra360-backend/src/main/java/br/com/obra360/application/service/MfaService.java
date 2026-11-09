package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import jakarta.persistence.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service @Transactional
public class MfaService {
    private final EntityManager em;
    private final byte[] encryptionKey;
    private final SecureRandom random=new SecureRandom();
    public MfaService(EntityManager em,@Value("${MFA_ENCRYPTION_KEY:}") String key) {
        this.em=em;
        try { encryptionKey=key.isBlank()?null:Base64.getDecoder().decode(key); }
        catch(IllegalArgumentException e){throw new IllegalStateException("MFA_ENCRYPTION_KEY deve ser Base64 de 32 bytes.");}
        if(encryptionKey!=null&&encryptionKey.length!=32)throw new IllegalStateException("MFA_ENCRYPTION_KEY deve conter 32 bytes.");
    }
    @Transactional(readOnly=true) public boolean enabled(Long id) { var m=em.find(MfaEntity.class,id);return m!=null&&m.isAtivo(); }
    public boolean available(){return encryptionKey!=null;}
    public Map<String,String> prepare(UsuarioEntity user){
        requireKey(); var m=em.find(MfaEntity.class,user.getId(),LockModeType.PESSIMISTIC_WRITE);
        if(m!=null&&m.isAtivo())throw new ResponseStatusException(HttpStatus.CONFLICT,"A autenticação em duas etapas já está ativa.");
        byte[] secret=new byte[20];random.nextBytes(secret);
        boolean fresh=m==null;
        if(fresh){m=new MfaEntity();m.setUsuarioId(user.getId());}
        String base32=base32(secret);m.setSegredoCifrado(encrypt(base32));m.setAtivo(false);m.setExpiraEm(OffsetDateTime.now().plusMinutes(10));m.setUltimoContador(-1);m.setCodigosHash("");
        if(fresh)em.persist(m);
        em.flush();
        String label=java.net.URLEncoder.encode("Obra360:"+user.getEmail(),StandardCharsets.UTF_8).replace("+","%20");
        return Map.of("segredo",base32,"uri","otpauth://totp/"+label+"?secret="+base32+"&issuer=Obra360&algorithm=SHA1&digits=6&period=30");
    }
    public List<String> activate(Long id,String code){
        var m=em.find(MfaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(m==null||m.isAtivo()||!m.getExpiraEm().isAfter(OffsetDateTime.now()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Inicie a configuração novamente.");
        if(!consume(m,code,false))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Código inválido ou já utilizado.");
        m.setAtivo(true);List<String> codes=new ArrayList<>();List<String> hashes=new ArrayList<>();
        for(int i=0;i<10;i++){byte[] b=new byte[18];random.nextBytes(b);String c=Base64.getUrlEncoder().withoutPadding().encodeToString(b);codes.add(c);hashes.add(PasswordRecoveryService.hash(c));}
        m.setCodigosHash(String.join(",",hashes));revoke(id);audit(id,"ATIVAR_MFA");return codes;
    }
    public boolean verify(Long id,String code){
        var m=em.find(MfaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        return m==null||!m.isAtivo()||consume(m,code,true);
    }
    public void disable(Long id,String code){
        var m=em.find(MfaEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(m==null||!m.isAtivo()||!consume(m,code,true))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Código inválido ou já utilizado.");
        em.remove(m);revoke(id);audit(id,"DESATIVAR_MFA");
    }
    private void revoke(Long id){var u=em.find(UsuarioEntity.class,id,LockModeType.PESSIMISTIC_WRITE);u.setVersaoCredencial(u.getVersaoCredencial()+1);}
    private void audit(Long id,String action){var u=em.find(UsuarioEntity.class,id);em.persist(LogAuditoriaEntity.builder().empresaId(u.getEmpresaId()).usuarioId(id).acao(action).entidadeAfetada("usuario").entidadeId(id).build());}
    private boolean consume(MfaEntity m,String code,boolean recovery){
        if(code==null||code.length()>64)return false;
        if(recovery&&code.matches("[A-Za-z0-9_-]{24}")){
            List<String> hashes=new ArrayList<>(Arrays.asList(m.getCodigosHash().split(",")));
            if(hashes.remove(PasswordRecoveryService.hash(code))){m.setCodigosHash(String.join(",",hashes));return true;}return false;
        }
        if(!code.matches("[0-9]{6}"))return false;
        byte[] secret=decode32(decrypt(m.getSegredoCifrado()));long now=Instant.now().getEpochSecond()/30;
        for(long counter=now-1;counter<=now+1;counter++){
            if(counter>m.getUltimoContador()&&MessageDigest.isEqual(totp(secret,counter).getBytes(StandardCharsets.US_ASCII),code.getBytes(StandardCharsets.US_ASCII))){m.setUltimoContador(counter);return true;}
        }return false;
    }
    public static String totp(byte[] secret,long counter){
        try{Mac mac=Mac.getInstance("HmacSHA1");mac.init(new SecretKeySpec(secret,"HmacSHA1"));byte[] h=mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());int o=h[h.length-1]&15;
            int n=((h[o]&127)<<24)|((h[o+1]&255)<<16)|((h[o+2]&255)<<8)|(h[o+3]&255);return String.format(Locale.ROOT,"%06d",n%1000000);
        }catch(GeneralSecurityException e){throw new IllegalStateException("Falha no autenticador.",e);}
    }
    private void requireKey(){if(encryptionKey==null)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"MFA indisponível: configure a chave de criptografia no servidor.");}
    private String encrypt(String value){
        requireKey();try{byte[] nonce=new byte[12];random.nextBytes(nonce);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(encryptionKey,"AES"),new GCMParameterSpec(128,nonce));
            byte[] encrypted=c.doFinal(value.getBytes(StandardCharsets.UTF_8));return Base64.getEncoder().encodeToString(ByteBuffer.allocate(12+encrypted.length).put(nonce).put(encrypted).array());
        }catch(GeneralSecurityException e){throw new IllegalStateException("Falha ao proteger autenticador.",e);}
    }
    private String decrypt(String value){
        requireKey();try{byte[] b=Base64.getDecoder().decode(value);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(encryptionKey,"AES"),new GCMParameterSpec(128,Arrays.copyOf(b,12)));return new String(c.doFinal(Arrays.copyOfRange(b,12,b.length)),StandardCharsets.UTF_8);
        }catch(GeneralSecurityException|IllegalArgumentException e){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Chave do autenticador indisponível. Contate o responsável pelo sistema.");}
    }
    private static final String ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static String base32(byte[] bytes){StringBuilder out=new StringBuilder();int buffer=0,bits=0;for(byte b:bytes){buffer=(buffer<<8)|(b&255);bits+=8;while(bits>=5){bits-=5;out.append(ALPHABET.charAt((buffer>>bits)&31));}}if(bits>0)out.append(ALPHABET.charAt((buffer<<(5-bits))&31));return out.toString();}
    public static byte[] decode32(String s){java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();int buffer=0,bits=0;for(char c:s.toCharArray()){int n=ALPHABET.indexOf(c);if(n<0)throw new IllegalArgumentException();buffer=(buffer<<5)|n;bits+=5;if(bits>=8){bits-=8;out.write((buffer>>bits)&255);}}return out.toByteArray();}
}
