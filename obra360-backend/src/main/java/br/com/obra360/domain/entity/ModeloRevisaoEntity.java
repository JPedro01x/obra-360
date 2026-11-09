package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Entity @Table(name="modelo_revisao",uniqueConstraints=@UniqueConstraint(name="uq_modelo_revisao",columnNames={"modelo_id","numero"})) @Getter @Setter @NoArgsConstructor
@org.hibernate.annotations.Immutable
public class ModeloRevisaoEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="modelo_id",nullable=false) private Long modeloId;
 @Column(name="empresa_id",nullable=false) private Long empresaId;
 @Column(name="usuario_id",nullable=false) private Long usuarioId;
 @Column(nullable=false) private int numero;
 @Column(nullable=false,length=150) private String nome;
 @Column(nullable=false,length=500) private String motivo;
 @Column(nullable=false,columnDefinition="TEXT") private String documento;
 @Column(name="criado_em",nullable=false,updatable=false) private OffsetDateTime criadoEm;
 @PrePersist void created(){criadoEm=OffsetDateTime.now();}
}
