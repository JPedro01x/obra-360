package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "etapa_cronograma", indexes = {
    @Index(name = "idx_etapa_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtapaCronogramaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "nome_etapa", nullable = false, length = 200)
    private String nomeEtapa;

    @Column(name = "ordem_execucao", nullable = false)
    private Integer ordemExecucao;

    @Column(name = "data_inicio_prevista", nullable = false)
    private LocalDate dataInicioPrevista;

    @Column(name = "data_fim_prevista", nullable = false)
    private LocalDate dataFimPrevista;

    @Column(name = "percentual_executado", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualExecutado;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (percentualExecutado == null) {
            percentualExecutado = BigDecimal.ZERO;
        }
    }
}
