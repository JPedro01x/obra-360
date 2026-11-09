package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Entity @Table(name="password_reset") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasswordResetEntity {
    @Id @Column(name="token_hash",length=64) private String tokenHash;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="expira_em",nullable=false) private OffsetDateTime expiraEm;
    @Column(nullable=false) private boolean usado;
}
