package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "projeto_obra", indexes = {
    @Index(name = "idx_projeto_empresa", columnList = "empresa_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetoObraEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "engenheiro_responsavel_id", nullable = false)
    private Long engenheiroResponsavelId;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "vgv_estimado", nullable = false, precision = 15, scale = 2)
    private BigDecimal vgvEstimado;

    @Column(name = "area_total_m2", nullable = false, precision = 12, scale = 2)
    private BigDecimal areaTotalM2;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_previsao_fim", nullable = false)
    private LocalDate dataPrevisaoFim;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
    }
}
