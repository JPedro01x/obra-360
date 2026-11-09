package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "modelo_rascunho", uniqueConstraints =
    @UniqueConstraint(name = "uq_rascunho_modelo_usuario", columnNames = {"modelo_id", "usuario_id"}))
@Getter @Setter
public class ModeloRascunhoEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "modelo_id", nullable = false)
    private Long modeloId;
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;
    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;
    @Column(name = "versao_base", nullable = false)
    private long versaoBase;
    @Column(nullable = false, length = 36)
    private String token;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String documento;
    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;
}
