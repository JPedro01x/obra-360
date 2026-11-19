package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;

/** Metadata only: never stores the Kafka payload or an exception message. */
@Entity @Table(name="falha_mensageria")
@Getter @Setter @NoArgsConstructor
public class FalhaMensageriaEntity {
    @Id @Column(length=36) private String id;
    @Column(name="empresa_id") private Long empresaId;
    @Column(name="evento_id",length=36) private String eventoId;
    @Column(nullable=false,length=249) private String topico;
    @Column(nullable=false) private int particao;
    @Column(nullable=false) private long deslocamento;
    @Column(name="hash_conteudo",nullable=false,length=64) private String hashConteudo;
    @Column(name="tipo_erro",nullable=false,length=160) private String tipoErro;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="resolvido_em") private OffsetDateTime resolvidoEm;
    @Column(name="operador_id") private Long operadorId;
}
