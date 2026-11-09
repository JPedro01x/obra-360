package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_ponto") @Getter @Setter @NoArgsConstructor
public class RhPontoEntity extends RhBase {
 @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
 @Column(name="data",nullable=false) private LocalDate data;
 @Column(name="entrada",nullable=false) private LocalTime entrada;
 @Column(name="saida_intervalo") private LocalTime saidaIntervalo;
 @Column(name="retorno_intervalo") private LocalTime retornoIntervalo;
 @Column(name="saida",nullable=false) private LocalTime saida;
 @Column(name="minutos_trabalhados",nullable=false) private Integer minutosTrabalhados;
 @Column(name="observacao",length=500) private String observacao;
 @Column(name="situacao",nullable=false,length=20) private String situacao;
}
