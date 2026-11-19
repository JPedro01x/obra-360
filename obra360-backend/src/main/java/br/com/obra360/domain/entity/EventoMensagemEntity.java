package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;

/** Durable outbox and consumer receipt. Contains identifiers, never credentials. */
@Entity @Table(name="evento_mensagem", indexes=@Index(name="idx_evento_mensagem_pendente",columnList="publicado_em,proxima_tentativa"))
@Getter @Setter @NoArgsConstructor
public class EventoMensagemEntity {
    @Id @Column(length=36) private String id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(name="ordem_id",nullable=false) private Long ordemId;
    @Column(nullable=false,length=80) private String protocolo;
    @Column(name="criado_em",nullable=false) private OffsetDateTime criadoEm;
    @Column(name="proxima_tentativa",nullable=false) private OffsetDateTime proximaTentativa;
    @Column(name="publicado_em") private OffsetDateTime publicadoEm;
    @Column(name="processado_em") private OffsetDateTime processadoEm;
    @Column(nullable=false) private int tentativas;
}
