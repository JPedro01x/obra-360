package br.com.obra360.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/** Read model returned by the physical-measurement list use case. */
public record MedicaoFisicaItem(
    Long id, Long empresaId, Long projetoObraId, Long etapaCronogramaId, LocalDate competencia,
    String descricao, BigDecimal quantidade, String unidade, BigDecimal percentualAnterior,
    BigDecimal percentualMedido, BigDecimal valorMedido, String status, Long criadoPor,
    Long aprovadoPor, Long liberadoPor, OffsetDateTime criadoEm, OffsetDateTime atualizadoEm
) {}
