package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_estrutura") @Getter @Setter @NoArgsConstructor
public class RhEstruturaEntity extends RhBase {
 @Column(name="tipo",nullable=false,length=20) private String tipo;
 @Column(name="nome",nullable=false,length=150) private String nome;
 @Column(name="departamento_id") private Long departamentoId;
 @Column(name="ativo",nullable=false) private Boolean ativo;
}
