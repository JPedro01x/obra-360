package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="sessao_acesso", indexes=@Index(name="idx_sessao_usuario",columnList="usuario_id"))
@Getter @Setter @NoArgsConstructor
public class SessaoEntity {
    @Id @Column(length=36) private String id;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(name="versao_credencial",nullable=false) private long versaoCredencial;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="expira_em",nullable=false) private OffsetDateTime expiraEm;
    @Column(name="revogado_em") private OffsetDateTime revogadoEm;
}
