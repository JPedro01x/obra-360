package br.com.obra360.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Filtro Servlet responsável pelo Rate Limiting (Limitação de Taxa de Requisições por IP).
 * Limita rajadas por IP em uma instância, com contadores atômicos e cache limitado.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUISICOES_POR_MINUTO = 100;
    @org.springframework.beans.factory.annotation.Value("${obra360.security.requests-per-minute:100}")
    private int limit=MAX_REQUISICOES_POR_MINUTO;
    private static final int MAX_IPS=10000;
    private record Window(long start,int count) {}
    private final ConcurrentHashMap<String,Window> windows=new ConcurrentHashMap<>();
    private final AtomicLong calls=new AtomicLong();

    @jakarta.annotation.PostConstruct
    void validateConfiguration() {
        if(limit<1 || limit>1_000_000) throw new IllegalStateException("requests-per-minute deve estar entre 1 e 1000000.");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp=obterIpCliente(request);long now=Instant.now().getEpochSecond();
        if(calls.incrementAndGet()%1024==0 || windows.size()>=MAX_IPS)
            windows.entrySet().removeIf(entry -> now-entry.getValue().start()>=60);
        if(!windows.containsKey(clientIp) && windows.size()>=MAX_IPS) {reject(response,60);return;}
        Window current=windows.compute(clientIp,(key,previous) -> previous==null || now-previous.start()>=60
            ? new Window(now,1) : new Window(previous.start(),Math.min(previous.count()+1,Math.max(1,limit)+1)));
        if(current.count()>Math.max(1,limit)) {reject(response,Math.max(1,60-(now-current.start())));return;}
        filterChain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response,long retry) throws IOException {
        response.setStatus(429);response.setCharacterEncoding("UTF-8");response.setContentType("application/problem+json");
        response.setHeader("Retry-After",String.valueOf(retry));response.setHeader("Cache-Control","no-store");
        response.getWriter().write("{\"title\":\"Limite de requisições excedido\",\"status\":429,\"detail\":\"Muitas requisições. Aguarde antes de tentar novamente.\"}");
    }

    private String obterIpCliente(HttpServletRequest request) {
        // Forwarded headers are not trusted unless resolved by an explicitly
        // configured trusted reverse proxy; client input cannot bypass limits.
        return request.getRemoteAddr();
    }
}
