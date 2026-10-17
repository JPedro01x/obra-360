package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "solicitacao_servico", indexes = {
    @Index(name = "idx_solicitacao_contrato", columnList = "contrato_servico_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitacaoServicoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contrato_servico_id", nullable = false)
    private Long contratoServicoId;

    @Column(name = "equipe_trabalho_id")
    private Long equipeTrabalhoId;

    @Column(name = "unidade_imobiliaria_id")
    private Long unidadeImobiliariaId;

    @Column(name = "codigo_protocolo", nullable = false, unique = true, length = 30)
    private String codigoProtocolo;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "status_os", nullable = false, length = 30)
    private String statusOs; // 'ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'

    @Column(name = "prioridade", nullable = false, length = 20)
    private String prioridade; // 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'

    @Column(name = "data_abertura", nullable = false, updatable = false)
    private OffsetDateTime dataAbertura;

    @Column(name = "data_limite_sla", nullable = false)
    private OffsetDateTime dataLimiteSla;

    @Column(name = "data_encerramento")
    private OffsetDateTime dataEncerramento;

    @PrePersist
    public void prePersist() {
        if (dataAbertura == null) {
            dataAbertura = OffsetDateTime.now();
        }
        if (statusOs == null) {
            statusOs = "ABERTO";
        }
        if (prioridade == null) {
            prioridade = "MEDIA";
        }
    }
}
