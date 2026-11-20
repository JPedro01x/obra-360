package br.com.obra360.infrastructure.security;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class FinancialFixtureDatesTest {
    @Test void financialPayloadUsesSaoPauloDayAfterUtcMidnight() {
        var clock = Clock.fixed(Instant.parse("2026-11-20T00:04:00Z"), ZoneOffset.UTC);
        assertEquals(LocalDate.of(2026, 11, 19), WorkspaceSecurityIntegrationTest.financialToday(clock));
    }

    @Test void financialPayloadAdvancesAtSaoPauloMidnight() {
        var clock = Clock.fixed(Instant.parse("2026-11-20T03:00:00Z"), ZoneOffset.UTC);
        assertEquals(LocalDate.of(2026, 11, 20), WorkspaceSecurityIntegrationTest.financialToday(clock));
    }
}
