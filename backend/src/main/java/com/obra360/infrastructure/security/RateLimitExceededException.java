package com.obra360.infrastructure.security;

/**
 * Exceção disparada quando um cliente excede a taxa de requisições permitida por minuto (Rate Limit).
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
