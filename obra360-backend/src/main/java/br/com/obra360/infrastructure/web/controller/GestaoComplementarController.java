package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;

@RestController @RequestMapping("/api/v1/workspace") @RequiredArgsConstructor @Transactional
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO')")
public class GestaoComplementarController {
    private final EntityManager em;
    private final OperacaoService operation;
    private final br.com.obra360.application.service.PlanningDates dates;
    private final br.com.obra360.application.service.QualidadeService qualityService;
    private final br.com.obra360.application.service.GarantiaWorkflowService warrantyService;
    private void audit(String action,String entity,Long id,Authentication a) { operation.audit(action,entity,id,Long.valueOf(a.getName())); }
    @PostMapping("/cronograma") @ResponseStatus(HttpStatus.CREATED)
    public EtapaCronogramaEntity stage(@Valid @RequestBody StageRequest r,Authentication a) {
        operation.project(r.projetoObraId());
        dates.newPeriod(r.dataInicioPrevista(),r.dataFimPrevista());
        var e=EtapaCronogramaEntity.builder().projetoObraId(r.projetoObraId()).nomeEtapa(r.nomeEtapa().trim()).ordemExecucao(r.ordemExecucao())
            .dataInicioPrevista(r.dataInicioPrevista()).dataFimPrevista(r.dataFimPrevista()).percentualExecutado(BigDecimal.ZERO).build();
        em.persist(e);audit("CRIAR_ETAPA","etapa_cronograma",e.getId(),a);return e;
    }
    @PatchMapping("/cronograma/{id}/progresso")
    public EtapaCronogramaEntity progress(@PathVariable Long id,@Valid @RequestBody ProgressRequest r,Authentication a) {
        var e=em.find(EtapaCronogramaEntity.class,id,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(e==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        operation.project(e.getProjetoObraId());e.setPercentualExecutado(r.percentualExecutado());audit("ATUALIZAR_PROGRESSO","etapa_cronograma",id,a);return e;
    }
    @PostMapping(value="/qualidade",consumes="application/json") @ResponseStatus(HttpStatus.CREATED)
    public OcorrenciaQualidadeEntity quality(@Valid @RequestBody QualityRequest r,Authentication a) {
        return qualityService.create(r.projetoObraId(),r.responsavelId(),r.titulo(),r.normaRegulamentadora(),r.grauSeveridade(),null,Long.valueOf(a.getName()));
    }
    @PostMapping(value="/qualidade",consumes="multipart/form-data") @ResponseStatus(HttpStatus.CREATED)
    public OcorrenciaQualidadeEntity qualityWithPhoto(@Valid @RequestPart("dados") QualityRequest r,
        @RequestPart(value="arquivo",required=false) org.springframework.web.multipart.MultipartFile file,Authentication a) {
        return qualityService.create(r.projetoObraId(),r.responsavelId(),r.titulo(),r.normaRegulamentadora(),r.grauSeveridade(),file,Long.valueOf(a.getName()));
    }
    @PatchMapping("/qualidade/{id}/status")
    public OcorrenciaQualidadeEntity qualityStatus(@PathVariable Long id,@Valid @RequestBody QualityStatusRequest r,Authentication a) {
        return qualityService.state(id,r.status(),Long.valueOf(a.getName()));
    }
    @PostMapping("/unidades") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public UnidadeImobiliariaEntity unit(@Valid @RequestBody UnitRequest r,Authentication a) {
        operation.project(r.projetoObraId());
        var e=UnidadeImobiliariaEntity.builder().projetoObraId(r.projetoObraId()).codigoUnidade(r.codigoUnidade().trim())
            .areaPrivativaM2(r.areaPrivativaM2()).valorTabela(r.valorTabela()).statusVenda("DISPONIVEL").build();
        em.persist(e);audit("CRIAR_UNIDADE","unidade_imobiliaria",e.getId(),a);return e;
    }
    @PatchMapping("/unidades/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','INCORPORADOR')")
    public UnidadeImobiliariaEntity unitStatus(@PathVariable Long id,@Valid @RequestBody UnitStatusRequest r,Authentication a) {
        var e=em.find(UnidadeImobiliariaEntity.class,id,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(e==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        operation.project(e.getProjetoObraId());
        if(!e.getStatusVenda().equals(r.situacaoEsperada())) throw new ResponseStatusException(HttpStatus.CONFLICT,"A situação da unidade mudou. Atualize a consulta.");
        e.setStatusVenda(r.status());if(!"RESERVADO".equals(r.status()))e.setReservaUsuarioId(null);audit("UNIDADE_"+r.status(),"unidade_imobiliaria",id,a);return e;
    }
    @PostMapping("/cotacoes") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','INCORPORADOR')")
    public CotacaoB2BEntity quote(@Valid @RequestBody QuoteRequest r,Authentication a) {
        var supplier=em.find(FornecedorB2BEntity.class,r.fornecedorB2bId(),jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(supplier==null || !TenantContext.getCurrentTenant().equals(supplier.getEmpresaId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var e=CotacaoB2BEntity.builder().empresaId(TenantContext.getCurrentTenant()).fornecedorB2bId(r.fornecedorB2bId())
            .codigoCotacao(r.codigoCotacao().trim()).valorProposta(r.valorProposta()).prazoEntregaDias(r.prazoEntregaDias()).statusCotacao("EM_ANALISE").build();
        em.persist(e);audit("CRIAR_COTACAO","cotacao_b2b",e.getId(),a);return e;
    }
    @PostMapping("/garantias") @ResponseStatus(HttpStatus.CREATED)
    public GarantiaPosVendaEntity warranty(@Valid @RequestBody WarrantyRequest r,Authentication a) {
        return warrantyService.create(r.unidadeImobiliariaId(),r.usuarioClienteId(),r.descricaoDefeito(),r.categoriaDefeito(),Long.valueOf(a.getName()));
    }
    @PatchMapping("/garantias/{id}/status")
    public GarantiaPosVendaEntity warrantyStatus(@PathVariable Long id,@Valid @RequestBody WarrantyStatusRequest r,Authentication a) {
        return warrantyService.state(id,r.status(),Long.valueOf(a.getName()));
    }
    public record StageRequest(@NotNull @Positive Long projetoObraId,@NotBlank @Size(max=200) String nomeEtapa,@Min(1) int ordemExecucao,@NotNull LocalDate dataInicioPrevista,@NotNull LocalDate dataFimPrevista) {}
    public record ProgressRequest(@NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal percentualExecutado) {}
    public record QualityRequest(@NotNull @Positive Long projetoObraId,@NotNull @Positive Long responsavelId,@NotBlank @Size(max=200) String titulo,@NotBlank @Size(max=30) String normaRegulamentadora,@NotBlank @Pattern(regexp="BAIXA|MEDIA|ALTA|CRITICA") String grauSeveridade) {}
    public record QualityStatusRequest(@NotBlank @Pattern(regexp="PENDENTE|EM_ANDAMENTO|RESOLVIDO") String status) {}
    public record UnitRequest(@NotNull @Positive Long projetoObraId,@NotBlank @Size(max=30) String codigoUnidade,@NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=6,fraction=4) BigDecimal areaPrivativaM2,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorTabela) {}
    public record UnitStatusRequest(@NotBlank @Pattern(regexp="DISPONIVEL|RESERVADO|VENDIDO") String status,@NotBlank @Pattern(regexp="DISPONIVEL|RESERVADO|VENDIDO") String situacaoEsperada) {}
    public record QuoteRequest(@NotNull @Positive Long fornecedorB2bId,@NotBlank @Size(max=30) String codigoCotacao,@NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorProposta,@Min(0) @Max(3650) int prazoEntregaDias) {}
    public record WarrantyRequest(@NotNull @Positive Long unidadeImobiliariaId,@NotNull @Positive Long usuarioClienteId,@NotBlank @Size(max=10000) String descricaoDefeito,@NotBlank @Size(max=50) String categoriaDefeito) {}
    public record WarrantyStatusRequest(@NotBlank @Pattern(regexp="ABERTO|EM_ATENDIMENTO|CONCLUIDO") String status) {}
}
