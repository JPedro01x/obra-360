package br.com.obra360.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.URI;

@Component @RequiredArgsConstructor
public class IntegrationConfig {
    private final Environment environment;
    public String get(String name) {return environment.getProperty(name,"").trim();}
    public String secret(String name) {return environment.getProperty(name,"");}
    public String get(String name,String fallback) {String value=get(name);return value.isEmpty()?fallback:value;}
    public boolean has(String...names) {for(String name:names)if(get(name).isEmpty())return false;return true;}
    public boolean enabled(String name) {return "true".equalsIgnoreCase(get(name));}
    public void require(boolean available,String service) {if(!available)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,service+" não configurado nesta instalação.");}
    public URI endpoint(String address) {
        URI uri=URI.create(address);String host=uri.getHost();
        boolean local=host!=null&&java.util.Set.of("localhost","127.0.0.1","::1").contains(host);
        if(host==null||uri.getUserInfo()!=null||(!"https".equalsIgnoreCase(uri.getScheme())&&!(local&&"http".equalsIgnoreCase(uri.getScheme()))))throw new IllegalArgumentException("Endpoint precisa usar HTTPS (HTTP apenas no loopback local).");
        return uri;
    }
}
