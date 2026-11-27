package br.com.obra360.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Framework-independent catalog projection for a company project. */
public record ObraResumo(Long id, String nome, BigDecimal areaTotalM2, BigDecimal vgvEstimado,
                         LocalDate dataInicio, LocalDate dataPrevisaoFim) { }
