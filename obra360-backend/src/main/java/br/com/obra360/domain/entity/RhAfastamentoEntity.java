package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_afastamento") @Getter @Setter @NoArgsConstructor
public class RhAfastamentoEntity extends RhBase {
 @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
 @Column(name="tipo",nullable=false,length=30) private String tipo;
 @Column(name="inicio",nullable=false) private LocalDate inicio;
 @Column(name="fim",nullable=false) private LocalDate fim;
 @Column(name="observacao",length=500) private String observacao;
 @Column(name="situacao",nullable=false,length=20) private String situacao;
 @Column(name="aprovador_id") private Long aprovadorId;
}
