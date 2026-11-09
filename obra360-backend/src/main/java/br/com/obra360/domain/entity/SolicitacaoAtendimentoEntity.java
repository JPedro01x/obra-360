package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="solicitacao_atendimento",indexes=@Index(name="idx_atendimento_empresa",columnList="empresa_id"))
@Getter @Setter @NoArgsConstructor
public class SolicitacaoAtendimentoEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(nullable=false,length=30) private String categoria;
    @Column(nullable=false,length=150) private String assunto;
    @Column(nullable=false,length=4000) private String descricao;
    @Column(nullable=false,length=30) private String status;
    @Column(length=4000) private String resposta;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="atualizado_em",nullable=false) private OffsetDateTime atualizadoEm;
    @Version private long versao;
}
