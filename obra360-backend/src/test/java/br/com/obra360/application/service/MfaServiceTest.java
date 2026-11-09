package br.com.obra360.application.service;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.nio.charset.StandardCharsets;

class MfaServiceTest {
    @Test void matchesRfc6238Sha1VectorsWithSixDigits(){
        byte[] secret="12345678901234567890".getBytes(StandardCharsets.US_ASCII);
        assertEquals("287082",MfaService.totp(secret,59/30));
        assertEquals("081804",MfaService.totp(secret,1111111109L/30));
        assertEquals("050471",MfaService.totp(secret,1111111111L/30));
        assertEquals("279037",MfaService.totp(secret,2000000000L/30));
    }
}
