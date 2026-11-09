package br.com.obra360.application.service;

import br.com.obra360.domain.service.ValidadorSefazDomainService;
import br.com.obra360.infrastructure.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.http.*;
import java.nio.file.*;
import java.security.*;
import java.time.Duration;
import java.util.*;
import javax.net.ssl.*;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;

@Service @RequiredArgsConstructor
public class SefazConsultaService {
    private final IntegrationConfig config;private final ValidadorSefazDomainService validator;
    public boolean available(){return config.enabled("SEFAZ_ENABLED")&&config.has("SEFAZ_URL","SEFAZ_A1_PATH","SEFAZ_A1_PASSWORD","SEFAZ_EMPRESA_ID");}
    public Map<String,String> query(String key){
        config.require(available(),"Consulta SEFAZ");
        if(!String.valueOf(TenantContext.getCurrentTenant()).equals(config.get("SEFAZ_EMPRESA_ID")))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Certificado fiscal não vinculado à empresa autenticada.");
        if(!validator.validarChaveNfe44Digitos(key))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Chave NF-e inválida.");
        String environment=config.get("SEFAZ_AMBIENTE","2");if(!Set.of("1","2").contains(environment))throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Ambiente SEFAZ inválido.");
        try {
            char[] password=config.secret("SEFAZ_A1_PASSWORD").toCharArray();KeyStore store=KeyStore.getInstance("PKCS12");try(var file=Files.newInputStream(Path.of(config.get("SEFAZ_A1_PATH")))){store.load(file,password);}
            KeyManagerFactory keys=KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());keys.init(store,password);Arrays.fill(password,'\0');
            SSLContext ssl=SSLContext.getInstance("TLS");ssl.init(keys.getKeyManagers(),null,new SecureRandom());
            var client=HttpClient.newBuilder().sslContext(ssl).connectTimeout(Duration.ofSeconds(8)).followRedirects(HttpClient.Redirect.NEVER).build();
            var request=HttpRequest.newBuilder(config.endpoint(config.get("SEFAZ_URL"))).timeout(Duration.ofSeconds(25)).header("Content-Type","application/soap+xml; charset=utf-8; action=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF\"").POST(HttpRequest.BodyPublishers.ofString(envelope(key,environment))).build();
            var response=client.send(request,HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200||response.body().length()>2000000)throw new IllegalStateException();return parse(response.body(),key,environment);
        }catch(InterruptedException ex){Thread.currentThread().interrupt();throw unavailable();}catch(Exception ex){throw unavailable();}
    }
    public static String envelope(String key,String environment){if(!key.matches("[0-9]{44}")||!Set.of("1","2").contains(environment))throw new IllegalArgumentException();return "<soap12:Envelope xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\"><soap12:Body><nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4\"><consSitNFe xmlns=\"http://www.portalfiscal.inf.br/nfe\" versao=\"4.00\"><tpAmb>"+environment+"</tpAmb><xServ>CONSULTAR</xServ><chNFe>"+key+"</chNFe></consSitNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>";}
    public static Map<String,String> parse(String xml,String key,String environment) throws Exception {
        DocumentBuilderFactory factory=DocumentBuilderFactory.newInstance();factory.setNamespaceAware(true);factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl",true);factory.setFeature("http://xml.org/sax/features/external-general-entities",false);factory.setFeature("http://xml.org/sax/features/external-parameter-entities",false);factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD,"");factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA,"");
        var document=factory.newDocumentBuilder().parse(new java.io.ByteArrayInputStream(xml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        Node root=document.getElementsByTagNameNS("http://www.portalfiscal.inf.br/nfe","retConsSitNFe").item(0);if(root==null)throw new IllegalArgumentException();
        Map<String,String> data=new HashMap<>();for(Node child=root.getFirstChild();child!=null;child=child.getNextSibling())if(child.getNodeType()==Node.ELEMENT_NODE)data.put(child.getLocalName(),child.getTextContent());
        if(!key.equals(data.get("chNFe"))||!environment.equals(data.get("tpAmb"))||!data.containsKey("cStat"))throw new IllegalArgumentException();
        var protocol=((Element)root).getElementsByTagNameNS("http://www.portalfiscal.inf.br/nfe","nProt");
        return Map.of("chave",key,"ambiente",environment,"codigo",data.get("cStat"),"motivo",data.getOrDefault("xMotivo",""),"protocolo",protocol.getLength()>0?protocol.item(0).getTextContent():"");
    }
    private ResponseStatusException unavailable(){return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Não foi possível concluir a consulta fiscal. Verifique certificado, endpoint e disponibilidade da SEFAZ.");}
}

