package br.com.obra360.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro Servlet responsável pelo Rate Limiting (Limitação de Taxa de Requisições por IP).
 * Previne ataques de negação de serviço (DoS/DDoS) e varreduras automatizadas.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUISICOES_POR_MINUTO = 100;
    private final Map<String, AtomicInteger> contadorPorIp = new ConcurrentHashMap<>();
    private final Map<String, Instant> inicioJanelaPorIp = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = obterIpCliente(request);
        Instant agora = Instant.now();

        inicioJanelaPorIp.putIfAbsent(clientIp, agora);
        Instant inicioJanela = inicioJanelaPorIp.get(clientIp);

        if (agora.getEpochSecond() - inicioJanela.getEpochSecond() > 60) {
            // Reinicia a janela de 1 minuto
            inicioJanelaPorIp.put(clientIp, agora);
            contadorPorIp.put(clientIp, new AtomicInteger(1));
        } else {
            AtomicInteger contador = contadorPorIp.computeIfAbsent(clientIp, k -> new AtomicInteger(0));
            if (contador.incrementAndGet() > MAX_REQUISICOES_POR_MINUTO) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("""
                    {
                      "type": "https://obra360.com.br/erros/rate-limit-excedido",
                      "title": "Limite de Requisições Excedido (Rate Limit Exceeded)",
                      "status": 429,
                      "detail": "Você excedeu o limite máximo de 100 requisições por minuto. Por favor, aguarde antes de tentar novamente.",
                      "timestamp": "%s"
                    }
                    """.formatted(Instant.now()));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String obterIpCliente(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
