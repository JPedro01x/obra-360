package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name="orcamento_obra",uniqueConstraints=@UniqueConstraint(columnNames={"projeto_obra_id","revisao"})) @Getter @Setter @NoArgsConstructor
public class OrcamentoObraEntity extends RegistroGestao {
 @Column(nullable=false) private int revisao;
 @Column(name="valor_aprovado",nullable=false,precision=15,scale=2) private BigDecimal valorAprovado;
 @Column(nullable=false,length=20) private String situacao;
 @Column(nullable=false,length=1000) private String justificativa;
 @Column(name="autor_id",nullable=false) private Long autorId;
 @Column(name="aprovador_id") private Long aprovadorId;
}
