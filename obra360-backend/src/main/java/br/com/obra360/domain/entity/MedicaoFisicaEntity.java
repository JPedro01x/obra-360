package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name="medicao_fisica", indexes={@Index(name="idx_medicao_empresa_obra", columnList="empresa_id, projeto_obra_id, competencia")})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicaoFisicaEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="projeto_obra_id",nullable=false) private Long projetoObraId;
    @Column(name="etapa_cronograma_id",nullable=false) private Long etapaCronogramaId;
    @Column(nullable=false) private LocalDate competencia;
    @Column(nullable=false,length=2000) private String descricao;
    @Column(nullable=false,precision=15,scale=4) private BigDecimal quantidade;
    @Column(nullable=false,length=20) private String unidade;
    @Column(name="percentual_anterior",nullable=false,precision=5,scale=2) private BigDecimal percentualAnterior;
    @Column(name="percentual_medido",nullable=false,precision=5,scale=2) private BigDecimal percentualMedido;
    @Column(name="valor_medido",nullable=false,precision=15,scale=2) private BigDecimal valorMedido;
    @Column(nullable=false,length=30) private String status;
    @Column(name="criado_por",nullable=false) private Long criadoPor;
    @Column(name="aprovado_por") private Long aprovadoPor;
    @Column(name="liberado_por") private Long liberadoPor;
    @Column(name="criado_em",nullable=false,updatable=false) private OffsetDateTime criadoEm;
    @Column(name="atualizado_em",nullable=false) private OffsetDateTime atualizadoEm;
    @PrePersist void create(){var now=OffsetDateTime.now();if(criadoEm==null)criadoEm=now;if(atualizadoEm==null)atualizadoEm=now;if(status==null)status="EM_MEDICAO";}
    @PreUpdate void update(){atualizadoEm=OffsetDateTime.now();}
}
