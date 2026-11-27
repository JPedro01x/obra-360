package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name="projeto_configuracao_etapa", uniqueConstraints=@UniqueConstraint(
    name="uq_projeto_configuracao_etapa", columnNames={"empresa_id","projeto_obra_id","etapa"}))
@Getter @Setter @NoArgsConstructor
public class ProjetoConfiguracaoEtapaEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="projeto_obra_id",nullable=false) private Long projetoObraId;
    @Column(nullable=false,length=30) private String etapa;
    @Column(nullable=false,length=300) private String justificativa;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(name="atualizado_em",nullable=false) private OffsetDateTime atualizadoEm;
    @PrePersist @PreUpdate void touch(){atualizadoEm=OffsetDateTime.now();}
}
