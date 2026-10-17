package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usuario", indexes = {
    @Index(name = "idx_usuario_empresa", columnList = "empresa_id"),
    @Index(name = "idx_usuario_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "email", nullable = false, unique = true, length = 120)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "perfil", nullable = false, length = 30)
    private String perfil;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "tentativas_login_falhas", nullable = false)
    private Integer tentativasLoginFalhas;

    @Column(name = "bloqueado_ate")
    private OffsetDateTime bloqueadoAte;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (ativo == null) {
            ativo = true;
        }
        if (tentativasLoginFalhas == null) {
            tentativasLoginFalhas = 0;
        }
    }
}
