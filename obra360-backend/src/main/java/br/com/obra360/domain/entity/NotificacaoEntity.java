package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="notificacao") @Getter @Setter @NoArgsConstructor
public class NotificacaoEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(nullable=false,length=500) private String mensagem;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="lido_em") private OffsetDateTime lidoEm;
}
