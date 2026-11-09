package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_beneficio") @Getter @Setter @NoArgsConstructor
public class RhBeneficioEntity extends RhBase {
 @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
 @Column(name="nome",nullable=false,length=100) private String nome;
 @Column(name="valor_empresa",nullable=false,precision=15,scale=2) private BigDecimal valorEmpresa;
 @Column(name="desconto_funcionario",nullable=false,precision=15,scale=2) private BigDecimal descontoFuncionario;
 @Column(name="inicio",nullable=false) private LocalDate inicio;
 @Column(name="fim") private LocalDate fim;
 @Column(name="ativo",nullable=false) private Boolean ativo;
}
