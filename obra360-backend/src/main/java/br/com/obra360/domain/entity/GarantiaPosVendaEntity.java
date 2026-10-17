package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "garantia_pos_venda", indexes = {
    @Index(name = "idx_garantia_unidade", columnList = "unidade_imobiliaria_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarantiaPosVendaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unidade_imobiliaria_id", nullable = false)
    private Long unidadeImobiliariaId;

    @Column(name = "usuario_cliente_id", nullable = false)
    private Long usuarioClienteId;

    @Column(name = "codigo_chamado", nullable = false, unique = true, length = 30)
    private String codigoChamado;

    @Column(name = "descricao_defeito", nullable = false, columnDefinition = "TEXT")
    private String descricaoDefeito;

    @Column(name = "categoria_defeito", nullable = false, length = 50)
    private String categoriaDefeito;

    @Column(name = "status_chamado", nullable = false, length = 30)
    private String statusChamado; // 'ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'

    @Column(name = "data_abertura", nullable = false, updatable = false)
    private OffsetDateTime dataAbertura;

    @Column(name = "data_atendimento")
    private OffsetDateTime dataAtendimento;

    @PrePersist
    public void prePersist() {
        if (dataAbertura == null) {
            dataAbertura = OffsetDateTime.now();
        }
        if (statusChamado == null) {
            statusChamado = "ABERTO";
        }
    }
}
