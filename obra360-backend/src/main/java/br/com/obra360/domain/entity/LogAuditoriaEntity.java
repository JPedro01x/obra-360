package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "log_auditoria", indexes = {
    @Index(name = "idx_auditoria_empresa", columnList = "empresa_id"),
    @Index(name = "idx_auditoria_data", columnList = "data_hora")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAuditoriaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "empresa_id")
    private Long empresaId;

    @Column(name = "acao", nullable = false, length = 50)
    private String acao;

    @Column(name = "entidade_afetada", nullable = false, length = 100)
    private String entidadeAfetada;

    @Column(name = "entidade_id")
    private Long entidadeId;

    @Column(name = "detalhes_json", columnDefinition = "TEXT")
    private String detalhesJson;

    @Column(name = "ip_origem", length = 45)
    private String ipOrigem;

    @Column(name = "data_hora", nullable = false, updatable = false)
    private OffsetDateTime dataHora;

    @PrePersist
    public void prePersist() {
        if (dataHora == null) {
            dataHora = OffsetDateTime.now();
        }
    }
}
