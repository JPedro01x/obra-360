package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "documento_nfe_item", uniqueConstraints = @UniqueConstraint(
    name = "uk_documento_nfe_item_estoque", columnNames = {"documento_nfe_id", "item_estoque_id"}
))
@Getter
@Setter
@NoArgsConstructor
public class NfeItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "documento_nfe_id", nullable = false)
    private NfeDocumentoEntity documento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_estoque_id", nullable = false)
    private ItemEstoqueEntity itemEstoque;

    @Column(name = "quantidade", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantidade;

    @Column(name = "valor_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorUnitario;

    @Column(name = "valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;
}
