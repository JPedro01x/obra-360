package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cotacao_b2b", indexes = {
    @Index(name = "idx_cotacao_empresa", columnList = "empresa_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotacaoB2BEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "fornecedor_b2b_id", nullable = false)
    private Long fornecedorB2bId;

    @Column(name = "codigo_cotacao", nullable = false, unique = true, length = 30)
    private String codigoCotacao;

    @Column(name = "valor_proposta", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorProposta;

    @Column(name = "prazo_entrega_dias", nullable = false)
    private Integer prazoEntregaDias;

    @Column(name = "status_cotacao", nullable = false, length = 30)
    private String statusCotacao; // 'EM_ANALISE', 'APROVADO', 'REJEITADO'

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (statusCotacao == null) {
            statusCotacao = "EM_ANALISE";
        }
    }
}
