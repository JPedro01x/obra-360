package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "movimentacao_estoque", uniqueConstraints = @UniqueConstraint(
    name = "uk_movimentacao_documento_nfe_item", columnNames = {"documento_nfe_id", "item_estoque_id"}
), indexes = {
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

    @Column(name = "ordem_servico_id")
    private Long ordemServicoId;

    @Column(name = "chave_operacao", length = 36, unique = true)
    private String chaveOperacao;

    @Column(name = "tipo_movimentacao", nullable = false, length = 20)
    private String tipoMovimentacao;

    @Column(name = "quantidade", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantidade;

    @Column(name = "valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "chave_nfe_44_digitos", length = 44)
    private String chaveNfe44Digitos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_nfe_id")
    private NfeDocumentoEntity documentoNfe;

    @Column(name = "data_movimentacao", nullable = false, updatable = false)
    private OffsetDateTime dataMovimentacao;

    @PrePersist
    protected void onCreate() {
        this.dataMovimentacao = OffsetDateTime.now();
    }
}
