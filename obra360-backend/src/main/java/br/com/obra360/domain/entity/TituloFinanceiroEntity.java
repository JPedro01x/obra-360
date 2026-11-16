package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="titulo_financeiro",uniqueConstraints=@UniqueConstraint(columnNames={"empresa_id","origem"})) @Getter @Setter @NoArgsConstructor
public class TituloFinanceiroEntity extends RegistroGestao {
 @Column(nullable=false,length=10) private String tipo;
 @Column(nullable=false,length=40) private String categoria;
 @Column(nullable=false,length=250) private String descricao;
 @Column(nullable=false,length=150) private String contraparte;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal valor;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal baixado;
 @Column(nullable=false) private LocalDate vencimento;
 @Column(nullable=false,length=20) private String situacao;
 @Column(length=100) private String origem;
}
