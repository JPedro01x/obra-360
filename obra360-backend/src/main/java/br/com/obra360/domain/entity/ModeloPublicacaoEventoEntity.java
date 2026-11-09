package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "modelo_publicacao_evento")
@org.hibernate.annotations.Immutable
@Getter @Setter
public class ModeloPublicacaoEventoEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "modelo_id", nullable = false)
    private Long modeloId;
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;
    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;
    @Column(nullable = false, length = 150)
    private String autor;
    @Column(name = "unidade_id", nullable = false)
    private Long unidadeId;
    @Column(name = "unidade_codigo", nullable = false, length = 80)
    private String unidadeCodigo;
    @Column(nullable = false)
    private int revisao;
    @Column(nullable = false, length = 20)
    private String acao;
    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm;
}
