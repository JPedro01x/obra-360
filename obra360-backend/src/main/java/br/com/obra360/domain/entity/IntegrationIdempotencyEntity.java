package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "integracao_idempotencia", uniqueConstraints = @UniqueConstraint(
    name = "uk_integracao_idempotencia_chave",
    columnNames = {"empresa_id", "usuario_id", "operacao", "chave_hash"}
))
@Getter
@Setter
@NoArgsConstructor
public class IntegrationIdempotencyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(nullable = false, length = 20)
    private String operacao;

    @Column(name = "chave_hash", nullable = false, length = 64)
    private String chaveHash;

    @Column(name = "solicitacao_hash", nullable = false, length = 64)
    private String solicitacaoHash;

    @Column(nullable = false, length = 20)
    private String situacao;

    @Column(name = "criado_em", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime criadoEm;

    @Column(name = "finalizado_em", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime finalizadoEm;
}
