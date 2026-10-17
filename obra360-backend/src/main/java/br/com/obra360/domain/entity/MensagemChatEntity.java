package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "mensagem_chat", indexes = {
    @Index(name = "idx_chat_remetente", columnList = "remetente_id"),
    @Index(name = "idx_chat_destinatario", columnList = "destinatario_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "remetente_id", nullable = false)
    private Long remetenteId;

    @Column(name = "destinatario_id", nullable = false)
    private Long destinatarioId;

    @Column(name = "conteudo_mensagem", nullable = false, columnDefinition = "TEXT")
    private String conteudoMensagem;

    @Column(name = "lida", nullable = false)
    private Boolean lida;

    @Column(name = "data_envio", nullable = false, updatable = false)
    private OffsetDateTime dataEnvio;

    @PrePersist
    public void prePersist() {
        if (dataEnvio == null) {
            dataEnvio = OffsetDateTime.now();
        }
        if (lida == null) {
            lida = false;
        }
    }
}
