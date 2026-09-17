package com.obra360.infrastructure.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SECURITY BEST PRACTICE: RATE LIMITING & ANTI-BRUTE FORCE SERVICE
 * Implementa limitação de taxa em janela deslizante por IP para prevenir ataques de força bruta.
 */
@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long ONE_MINUTE_MILLIS = 60_000L;

    private final Map<String, UserRequestHistory> requestHistories = new ConcurrentHashMap<>();

    public boolean isAllowed(String clientIp) {
        if (clientIp == null || clientIp.trim().isEmpty()) {
            clientIp = "UNKNOWN_CLIENT";
        }

        long now = Instant.now().toEpochMilli();
        UserRequestHistory history = requestHistories.computeIfAbsent(clientIp, k -> new UserRequestHistory());

        synchronized (history) {
            // Remove timestamps mais antigos que 1 minuto
            history.timestamps.removeIf(timestamp -> timestamp < (now - ONE_MINUTE_MILLIS));

            if (history.timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                return false;
            }

            history.timestamps.add(now);
            return true;
        }
    }

    private static class UserRequestHistory {
        private final java.util.List<Long> timestamps = new java.util.ArrayList<>();
    }
}
