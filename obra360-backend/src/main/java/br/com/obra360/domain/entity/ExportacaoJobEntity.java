package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Entity @Table(name="exportacao_job") @Getter @Setter @NoArgsConstructor
public class ExportacaoJobEntity {
 @Id @Column(length=36) private String id;
 @Column(name="empresa_id",nullable=false) private Long empresaId;
 @Column(name="usuario_id",nullable=false) private Long usuarioId;
 @Column(nullable=false,length=20) private String situacao;
 @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
 @Column(name="expira_em",nullable=false) private OffsetDateTime expiraEm;
 @Column(nullable=false,length=250) private String mensagem;
 @Column(nullable=false) private long tamanho;
}
