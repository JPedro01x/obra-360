package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Entity @Table(name="modelo_obra",uniqueConstraints=@UniqueConstraint(name="uq_modelo_obra_nome",columnNames={"projeto_obra_id","nome"})) @Getter @Setter @NoArgsConstructor
public class ModeloObraEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="empresa_id",nullable=false) private Long empresaId;
 @Column(name="projeto_obra_id",nullable=false) private Long projetoObraId;
 @Column(name="unidade_publicada_id") private Long unidadePublicadaId;
 @Column(name="revisao_publicada") private Integer revisaoPublicada;
 @Column(nullable=false,length=150) private String nome;
 @Column(nullable=false) private boolean arquivado;
 @Version @Column(nullable=false) private long versao;
 @Column(nullable=false) private int revisao;
 @Column(nullable=false,columnDefinition="TEXT") private String documento;
 @Column(name="criado_em",nullable=false,updatable=false) private OffsetDateTime criadoEm;
 @Column(name="atualizado_em",nullable=false) private OffsetDateTime atualizadoEm;
 @PrePersist void created(){criadoEm=OffsetDateTime.now();atualizadoEm=criadoEm;}

 public void preservarPublicacaoLegada() {
     if (unidadePublicadaId != null && revisaoPublicada == null) revisaoPublicada = revisao;
 }
}
