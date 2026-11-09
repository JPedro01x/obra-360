package br.com.obra360.application.service;

import br.com.obra360.infrastructure.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.*;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.EntityManager;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.*;
import java.security.interfaces.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class ExternalAdaptersTest {
    @TempDir Path temp;
    @Test void aiUsesConfiguredModelConsentPayloadAndRealHttpResponse() throws Exception {
        HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);AtomicReference<String> body=new AtomicReference<>();AtomicReference<String> authorization=new AtomicReference<>();
        server.createContext("/responses",exchange->{body.set(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));byte[] bytes="{\"output\":[{\"type\":\"message\",\"content\":[{\"type\":\"output_text\",\"text\":\"Resposta do servidor de teste\"}]}]}".getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().add("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();});server.start();
        try {var env=new MockEnvironment().withProperty("AI_ENABLED","true").withProperty("OPENAI_API_KEY","test-only").withProperty("AI_MODEL","configured-model").withProperty("AI_API_URL","http://127.0.0.1:"+server.getAddress().getPort()+"/responses");var service=new AiAssistantService(new IntegrationConfig(env),new ObjectMapper());assertEquals("Resposta do servidor de teste",service.ask(1L,"Organize minha lista de tarefas"));var payload=new ObjectMapper().readTree(body.get());assertFalse(payload.get("store").asBoolean());assertEquals("configured-model",payload.get("model").asText());assertEquals("Bearer test-only",authorization.get());assertFalse(payload.has("empresa"));}finally{server.stop(0);}
    }
    @Test void googleChecksSignatureAudienceExpiryAndNonce() throws Exception {
        var generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048);var pair=generator.generateKeyPair();var key=new RSAKey.Builder((RSAPublicKey)pair.getPublic()).privateKey((RSAPrivateKey)pair.getPrivate()).keyID("test-key").build();
        HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/jwks",exchange->{byte[] bytes=new JWKSet(key.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().add("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();});server.start();
        try {String nonce="A".repeat(43);var env=new MockEnvironment().withProperty("GOOGLE_CLIENT_ID","test-client").withProperty("GOOGLE_JWKS_URL","http://127.0.0.1:"+server.getAddress().getPort()+"/jwks");var service=new GoogleIdentityService(new IntegrationConfig(env),mock(EntityManager.class),mock(JwtService.class),mock(MfaService.class));String valid=googleToken(key,"test-client",nonce,Instant.now().plusSeconds(180));assertEquals("google-subject",service.verify(valid,nonce).getSubject());assertThrows(ResponseStatusException.class,()->service.verify(valid,"B".repeat(43)));assertThrows(ResponseStatusException.class,()->service.verify(googleToken(key,"other-client",nonce,Instant.now().plusSeconds(180)),nonce));assertThrows(ResponseStatusException.class,()->service.verify(googleToken(key,"test-client",nonce,Instant.now().minusSeconds(180)),nonce));assertThrows(ResponseStatusException.class,()->service.verify(valid.substring(0,valid.length()-5)+"AAAAA",nonce));}finally{server.stop(0);}
    }
    private String googleToken(RSAKey key,String audience,String nonce,Instant expires) throws Exception {var claims=new JWTClaimsSet.Builder().issuer("https://accounts.google.com").subject("google-subject").audience(audience).expirationTime(Date.from(expires)).issueTime(new Date()).claim("email_verified",true).claim("email","person@test.invalid").claim("nonce",nonce).build();var token=new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(),claims);token.sign(new RSASSASigner(key));return token.serialize();}
    @Test void sefazResponseChecksKeyAndEnvironmentAndRejectsXmlEntities() throws Exception {
        String key="1".repeat(44),xml="<retConsSitNFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><tpAmb>2</tpAmb><cStat>100</cStat><xMotivo>Resposta de teste</xMotivo><chNFe>"+key+"</chNFe><protNFe><infProt><nProt>123</nProt></infProt></protNFe></retConsSitNFe>";
        assertEquals("123",SefazConsultaService.parse(xml,key,"2").get("protocolo"));assertThrows(Exception.class,()->SefazConsultaService.parse(xml,"2".repeat(44),"2"));assertThrows(Exception.class,()->SefazConsultaService.parse(xml,key,"1"));assertThrows(Exception.class,()->SefazConsultaService.parse("<!DOCTYPE x [<!ENTITY x SYSTEM 'file:///sensitive'>]>"+xml,key,"2"));assertTrue(SefazConsultaService.envelope(key,"2").contains("<xServ>CONSULTAR</xServ>"));
    }
    @Test void s3AdapterTransfersBytesUsingSdkAndSignedHttpRequests() throws Exception {
        HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);Map<String,byte[]> objects=new java.util.concurrent.ConcurrentHashMap<>();AtomicReference<String> signature=new AtomicReference<>();
        server.createContext("/",exchange->{String path=exchange.getRequestURI().getPath();signature.set(exchange.getRequestHeaders().getFirst("Authorization"));switch(exchange.getRequestMethod()){case "PUT"-> {objects.put(path,exchange.getRequestBody().readAllBytes());exchange.sendResponseHeaders(200,-1);}case "GET"->{byte[] bytes=objects.get(path);if(bytes==null)exchange.sendResponseHeaders(404,-1);else{exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);}}case "DELETE"->{objects.remove(path);exchange.sendResponseHeaders(204,-1);}default->exchange.sendResponseHeaders(400,-1);}exchange.close();});server.start();
        String oldKey=System.getProperty("aws.accessKeyId"),oldSecret=System.getProperty("aws.secretAccessKey");System.setProperty("aws.accessKeyId","test-only");System.setProperty("aws.secretAccessKey","test-only-secret");
        try {var env=new MockEnvironment().withProperty("DOCUMENT_STORAGE","s3").withProperty("S3_BUCKET","test-bucket").withProperty("AWS_REGION","us-east-1").withProperty("S3_ENDPOINT","http://127.0.0.1:"+server.getAddress().getPort());var storage=new DocumentStorage(new IntegrationConfig(env),temp.toString());byte[] bytes="S3 test document".getBytes(StandardCharsets.UTF_8);String key=storage.put(bytes);assertTrue(key.startsWith("s3:"));assertArrayEquals(bytes,storage.read(key));assertTrue(signature.get().startsWith("AWS4-HMAC-SHA256"));storage.delete(key);assertTrue(objects.isEmpty());String privateKey=storage.putRh(bytes);assertTrue(privateKey.startsWith("s3rh:"));assertTrue(objects.keySet().stream().allMatch(p->p.startsWith("/test-bucket/obra360/rh/")));assertArrayEquals(bytes,storage.readRh(privateKey));assertThrows(IllegalArgumentException.class,()->storage.read(privateKey));storage.deleteRh(privateKey);assertTrue(objects.isEmpty());}finally{if(oldKey==null)System.clearProperty("aws.accessKeyId");else System.setProperty("aws.accessKeyId",oldKey);if(oldSecret==null)System.clearProperty("aws.secretAccessKey");else System.setProperty("aws.secretAccessKey",oldSecret);server.stop(0);}
    }
}
