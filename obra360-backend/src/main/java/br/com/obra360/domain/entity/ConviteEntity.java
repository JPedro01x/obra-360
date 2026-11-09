package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Entity @Table(name="convite_usuario",indexes=@Index(name="idx_convite_empresa",columnList="empresa_id"))
@Getter @Setter @NoArgsConstructor
public class ConviteEntity {
    @Id @Column(length=36) private String id;
    @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(nullable=false,length=120) private String email;
    @Column(nullable=false,length=30) private String perfil;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="expira_em",nullable=false) private OffsetDateTime expiraEm;
    @Column(nullable=false) private boolean usado;
    @Column(nullable=false) private boolean revogado;
}
