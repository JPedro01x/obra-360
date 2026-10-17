package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "equipe_trabalho", indexes = {
    @Index(name = "idx_equipe_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipeTrabalhoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "lider_encarregado_id", nullable = false)
    private Long liderEncarregadoId;

    @Column(name = "nome_equipe", nullable = false, length = 100)
    private String nomeEquipe;

    @Column(name = "especialidade", nullable = false, length = 100)
    private String especialidade; // 'ARMACAO', 'ALVENARIA', 'ELETRICA'

    @Column(name = "quantidade_operarios", nullable = false)
    private Integer quantidadeOperarios;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (quantidadeOperarios == null) {
            quantidadeOperarios = 1;
        }
    }
}
