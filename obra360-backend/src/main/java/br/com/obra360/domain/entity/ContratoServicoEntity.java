package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contrato_servico", indexes = {
    @Index(name = "idx_contrato_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratoServicoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "fornecedor_b2b_id", nullable = false)
    private Long fornecedorB2bId;

    @Column(name = "numero_contrato", nullable = false, unique = true, length = 50)
    private String numeroContrato;

    @Column(name = "valor_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "retencao_tecnica_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal retencaoTecnicaPct;

    @Column(name = "tempo_limite_sla_horas", nullable = false)
    private Integer tempoLimiteSlaHoras;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_termino", nullable = false)
    private LocalDate dataTermino;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (retencaoTecnicaPct == null) {
            retencaoTecnicaPct = new BigDecimal("5.00");
        }
        if (tempoLimiteSlaHoras == null) {
            tempoLimiteSlaHoras = 48;
        }
    }
}
