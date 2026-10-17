package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "item_estoque", indexes = {
    @Index(name = "idx_item_estoque_empresa_sku", columnList = "empresa_id, sku", unique = true),
    @Index(name = "idx_item_estoque_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemEstoqueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version // Proteção contra Race Condition via Optimistic Locking (Hibernate/JPA)
    private Long version;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "sku", nullable = false, length = 50)
    private String sku;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "categoria", nullable = false, length = 80)
    private String categoria;

    @Column(name = "unidade_medida", nullable = false, length = 20)
    private String unidadeMedida;

    @Column(name = "quantidade_atual", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantidadeAtual;

    @Column(name = "estoque_minimo", nullable = false, precision = 12, scale = 4)
    private BigDecimal estoqueMinimo;

    @Column(name = "custo_unitario_medio", nullable = false, precision = 12, scale = 2)
    private BigDecimal custoUnitarioMedio;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @Column(name = "data_atualizacao", nullable = false)
    private OffsetDateTime dataAtualizacao;

    @PrePersist
    protected void onCreate() {
        this.dataCriacao = OffsetDateTime.now();
        this.dataAtualizacao = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = OffsetDateTime.now();
    }
}
