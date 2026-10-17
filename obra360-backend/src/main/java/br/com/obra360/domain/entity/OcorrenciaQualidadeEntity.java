package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ocorrencia_qualidade", indexes = {
    @Index(name = "idx_ocorrencia_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OcorrenciaQualidadeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "responsavel_id", nullable = false)
    private Long responsavelId;

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "norma_regulamentadora", nullable = false, length = 30)
    private String normaRegulamentadora; // 'NR-18', 'ISO-9001'

    @Column(name = "grau_severidade", nullable = false, length = 20)
    private String grauSeveridade; // 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'

    @Column(name = "status_plano_acao", nullable = false, length = 30)
    private String statusPlanoAcao; // 'PENDENTE', 'EM_ANDAMENTO', 'RESOLVIDO'

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (statusPlanoAcao == null) {
            statusPlanoAcao = "PENDENTE";
        }
    }
}
