package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="baixa_financeira",uniqueConstraints=@UniqueConstraint(columnNames={"empresa_id","chave"})) @Getter @Setter @NoArgsConstructor
public class BaixaFinanceiraEntity extends RegistroGestao {
 @Column(name="titulo_id",nullable=false) private Long tituloId;
 @Column(nullable=false,length=36) private String chave;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal valor;
 @Column(name="data_efetiva",nullable=false) private LocalDate dataEfetiva;
 @Column(nullable=false,length=80) private String conta;
 @Column(nullable=false,length=500) private String observacao;
 @Column(name="operador_id",nullable=false) private Long operadorId;
 @Column(name="estorno_de",unique=true) private Long estornoDe;
 @Column(name="estornado",nullable=false) private boolean estornado;
}
