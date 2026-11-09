package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_candidato") @Getter @Setter @NoArgsConstructor
public class RhCandidatoEntity extends RhBase {
 @Column(name="vaga_id",nullable=false) private Long vagaId;
 @Column(name="nome",nullable=false,length=150) private String nome;
 @Column(name="email",nullable=false,length=120) private String email;
 @Column(name="telefone",length=30) private String telefone;
 @Column(name="etapa",nullable=false,length=20) private String etapa;
 @Column(name="observacao",length=1000) private String observacao;
}
