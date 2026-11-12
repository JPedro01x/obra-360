package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.GarantiaWorkflowService;
import br.com.obra360.domain.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.*;

@RestController @RequestMapping("/api/v1/workspace") @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO')")
public class GarantiaWorkflowController {
    private final GarantiaWorkflowService service;
    public GarantiaWorkflowController(GarantiaWorkflowService service) {this.service=service;}
    @PostMapping("/coberturas") @ResponseStatus(HttpStatus.CREATED)
    public CoberturaGarantiaEntity coverage(@Valid @RequestBody Coverage r,Authentication a) {
        return service.coverage(r.unidadeId(),r.categoria(),r.dataInicio(),r.dataFim(),r.descricao(),r.ativo(),Long.valueOf(a.getName()));
    }
    @PostMapping("/garantias/{id}/avaliacao")
    public GarantiaPosVendaEntity assess(@PathVariable Long id,@Valid @RequestBody Assessment r,Authentication a) {return service.assess(id,r.decisao(),r.motivo(),Long.valueOf(a.getName()));}
    @PostMapping("/garantias/{id}/vistoria")
    public GarantiaPosVendaEntity schedule(@PathVariable Long id,@Valid @RequestBody Inspection r,Authentication a) {return service.schedule(id,r.responsavelId(),r.data(),Long.valueOf(a.getName()));}
    @PostMapping("/garantias/{id}/ordem")
    public GarantiaPosVendaEntity order(@PathVariable Long id,@Valid @RequestBody Order r,Authentication a) {return service.convert(id,r.contratoServicoId(),r.equipeTrabalhoId(),r.prioridade(),r.exigeMaterial(),Long.valueOf(a.getName()));}
    public record Coverage(@NotNull @Positive Long unidadeId,@NotBlank @Size(max=50) String categoria,@NotNull LocalDate dataInicio,@NotNull LocalDate dataFim,@NotBlank @Size(max=1000) String descricao,boolean ativo) {}
    public record Assessment(@NotBlank @Pattern(regexp="COBERTA|NAO_COBERTA") String decisao,@NotBlank @Size(min=10,max=2000) String motivo) {}
    public record Inspection(@NotNull @Positive Long responsavelId,@NotNull @Future OffsetDateTime data) {}
    public record Order(@NotNull @Positive Long contratoServicoId,@NotNull @Positive Long equipeTrabalhoId,@NotBlank @Pattern(regexp="BAIXA|MEDIA|ALTA|URGENTE") String prioridade,boolean exigeMaterial) {}
}
