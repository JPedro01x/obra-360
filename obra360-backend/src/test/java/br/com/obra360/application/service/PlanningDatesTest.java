package br.com.obra360.application.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class PlanningDatesTest {
    private final LocalDate today=LocalDate.of(2026,11,11);
    private final PlanningDates dates=new PlanningDates(Clock.fixed(Instant.parse("2026-11-11T15:00:00Z"),ZoneId.of("America/Sao_Paulo")));
    @Test void newDatesCannotBePastOrInverted() {
        assertThrows(ResponseStatusException.class,()->dates.newPeriod(today.minusDays(2),today.minusDays(1)));
        assertThrows(ResponseStatusException.class,()->dates.newPeriod(today,today.minusDays(1)));
        assertThrows(ResponseStatusException.class,()->dates.newPeriod(today.plusDays(3),today.plusDays(2)));
    }
    @Test void todayAndFuturePeriodsAreAllowed() {
        assertDoesNotThrow(()->dates.newPeriod(today,today));
        assertDoesNotThrow(()->dates.newPeriod(today.plusDays(1),today.plusDays(2)));
    }
    @Test void historicalDatesMayBePreservedButNotReplacedWithOtherPastDates() {
        var start=today.minusDays(20);var end=today.minusDays(10);
        assertDoesNotThrow(()->dates.changedPeriod(start,end,start,end));
        assertDoesNotThrow(()->dates.changedPeriod(start,today.plusDays(1),start,end));
        assertThrows(ResponseStatusException.class,()->dates.changedPeriod(start.plusDays(1),end,start,end));
        assertThrows(ResponseStatusException.class,()->dates.changedPeriod(start,end.plusDays(1),start,end));
    }
    @Test void businessDayDoesNotChangeAtUtcMidnight() {
        var local=new PlanningDates(Clock.fixed(Instant.parse("2026-11-12T01:00:00Z"),ZoneId.of("America/Sao_Paulo")));
        assertDoesNotThrow(()->local.newPeriod(today,today));
        assertThrows(ResponseStatusException.class,()->local.newPeriod(today.minusDays(1),today));
    }
}
