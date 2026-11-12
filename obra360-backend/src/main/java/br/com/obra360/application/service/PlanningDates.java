package br.com.obra360.application.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;

/** Date-only planning uses the company's configured business time zone. */
@Service
public class PlanningDates {
    private final Clock clock;

    @Autowired
    public PlanningDates(@Value("${obra360.business-zone:America/Sao_Paulo}") String zone) {
        this(Clock.system(ZoneId.of(zone)));
    }
    public PlanningDates(Clock clock) {this.clock=clock;}

    public void newPeriod(LocalDate start,LocalDate end) {changedPeriod(start,end,null,null);}

    public void changedPeriod(LocalDate start,LocalDate end,LocalDate previousStart,LocalDate previousEnd) {
        if(start==null || end==null) throw invalid("Informe as datas de início e término.");
        if(end.isBefore(start)) throw invalid("A data final deve ser igual ou posterior ao início.");
        LocalDate today=LocalDate.now(clock);
        if(start.isBefore(today) && !start.equals(previousStart)) throw invalid("A data de início não pode estar no passado.");
        if(end.isBefore(today) && !end.equals(previousEnd)) throw invalid("O prazo final não pode estar no passado.");
    }
    private ResponseStatusException invalid(String message) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
