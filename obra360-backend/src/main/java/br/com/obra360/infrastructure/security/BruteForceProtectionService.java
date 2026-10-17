package br.com.obra360.infrastructure.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de Proteção Contra Ataques de Força Bruta (Brute Force Protection).
 * Bloqueia IPs ou e-mails que falhem repetidamente na autenticação.
 */
@Service
public class BruteForceProtectionService {

    private static final int MAX_TENTATIVAS_FALHAS = 5;
    private static final long TEMPO_BLOQUEIO_SEGUNDOS = 900; // 15 minutos de lockout

    private final Map<String, Integer> tentativasPorIp = new ConcurrentHashMap<>();
    private final Map<String, Instant> ipBloqueadoAte = new ConcurrentHashMap<>();

    public void registrarFalhaLogin(String clientIp) {
        int tentativas = tentativasPorIp.getOrDefault(clientIp, 0) + 1;
        tentativasPorIp.put(clientIp, tentativas);

        if (tentativas >= MAX_TENTATIVAS_FALHAS) {
            ipBloqueadoAte.put(clientIp, Instant.now().plusSeconds(TEMPO_BLOQUEIO_SEGUNDOS));
        }
    }

    public void registrarSucessoLogin(String clientIp) {
        tentativasPorIp.remove(clientIp);
        ipBloqueadoAte.remove(clientIp);
    }

    public boolean isIpBloqueado(String clientIp) {
        Instant bloqueadoAte = ipBloqueadoAte.get(clientIp);
        if (bloqueadoAte == null) {
            return false;
        }

        if (Instant.now().isAfter(bloqueadoAte)) {
            // Tempo de bloqueio expirou
            ipBloqueadoAte.remove(clientIp);
            tentativasPorIp.remove(clientIp);
            return false;
        }

        return true;
    }
}
