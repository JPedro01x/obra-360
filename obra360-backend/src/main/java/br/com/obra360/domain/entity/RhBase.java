package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@MappedSuperclass @Getter @Setter
public abstract class RhBase {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="empresa_id",nullable=false) private Long empresaId;
 @Column(name="criado_em",nullable=false,updatable=false) private OffsetDateTime criadoEm;
 @Version @Column(nullable=false) private long versao;
 @PrePersist void created(){criadoEm=OffsetDateTime.now();}
}
