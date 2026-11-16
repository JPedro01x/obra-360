package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="extrato_bancario",uniqueConstraints={@UniqueConstraint(columnNames={"empresa_id","conta","identificador"}),@UniqueConstraint(columnNames={"baixa_id"})}) @Getter @Setter @NoArgsConstructor
public class ExtratoBancarioEntity extends RegistroGestao {
 @Column(nullable=false,length=80) private String conta;
 @Column(nullable=false,length=100) private String identificador;
 @Column(nullable=false) private LocalDate data;
 @Column(nullable=false,length=250) private String descricao;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal valor;
 @Column(name="baixa_id") private Long baixaId;
}
