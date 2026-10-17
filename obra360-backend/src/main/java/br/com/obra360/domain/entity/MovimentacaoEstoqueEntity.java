package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "movimentacao_estoque", indexes = {
    @Index(name = "idx_movimentacao_chave_nfe", columnList = "chave_nfe_44_digitos"),
    @Index(name = "idx_movimentacao_item", columnList = "item_estoque_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimentacaoEstoqueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_estoque_id", nullable = false)
    private Long itemEstoqueId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "tipo_movimentacao", nullable = false, length = 20)
    private String tipoMovimentacao;

    @Column(name = "quantidade", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantidade;

    @Column(name = "valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "chave_nfe_44_digitos", length = 44)
    private String chaveNfe44Digitos;

    @Column(name = "data_movimentacao", nullable = false, updatable = false)
    private OffsetDateTime dataMovimentacao;

    @PrePersist
    protected void onCreate() {
        this.dataMovimentacao = OffsetDateTime.now();
    }
}
