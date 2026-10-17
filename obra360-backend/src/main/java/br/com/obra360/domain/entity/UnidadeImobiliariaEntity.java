package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "unidade_imobiliaria", indexes = {
    @Index(name = "idx_unidade_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnidadeImobiliariaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "codigo_unidade", nullable = false, length = 30)
    private String codigoUnidade;

    @Column(name = "area_privativa_m2", nullable = false, precision = 10, scale = 4)
    private BigDecimal areaPrivativaM2;

    @Column(name = "valor_tabela", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorTabela;

    @Column(name = "status_venda", nullable = false, length = 30)
    private String statusVenda; // 'DISPONIVEL', 'RESERVADO', 'VENDIDO'

    @Column(name = "sistema_amortizacao", length = 20)
    private String sistemaAmortizacao; // 'PRICE', 'SAC'

    @Column(name = "indice_correcao", length = 20)
    private String indiceCorrecao; // 'INCC', 'IPCA'

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (statusVenda == null) {
            statusVenda = "DISPONIVEL";
        }
    }
}
