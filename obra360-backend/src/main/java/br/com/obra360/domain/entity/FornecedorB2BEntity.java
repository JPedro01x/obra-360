package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "fornecedor_b2b", indexes = {
    @Index(name = "idx_fornecedor_cnpj", columnList = "cnpj", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FornecedorB2BEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cnpj", nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "razao_social", nullable = false, length = 255)
    private String razaoSocial;

    @Column(name = "categoria_fornecimento", nullable = false, length = 100)
    private String categoriaFornecimento; // 'INSUMOS', 'FROTAS', 'SERVICOS'

    @Column(name = "status_homologacao", nullable = false, length = 30)
    private String statusHomologacao; // 'HOMOLOGADO', 'EM_ANALISE'

    @Column(name = "score_reputacao", nullable = false, precision = 3, scale = 2)
    private BigDecimal scoreReputacao;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (statusHomologacao == null) {
            statusHomologacao = "HOMOLOGADO";
        }
        if (scoreReputacao == null) {
            scoreReputacao = new BigDecimal("5.00");
        }
    }
}
