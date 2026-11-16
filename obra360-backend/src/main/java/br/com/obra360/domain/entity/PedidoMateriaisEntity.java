package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="pedido_materiais") @Getter @Setter @NoArgsConstructor
public class PedidoMateriaisEntity extends RegistroGestao {
 @Column(name="fornecedor_b2b_id",nullable=false) private Long fornecedorB2bId;
 @Column(nullable=false,length=1000) private String justificativa;
 @Column(name="referencia_proposta",nullable=false,length=150) private String referenciaProposta;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal total;
 @Column(nullable=false,length=30) private String situacao;
 @Column(nullable=false) private LocalDate vencimento;
 @Column(name="aprovador_gestao_id") private Long aprovadorGestaoId;
 @Column(name="aprovador_financeiro_id") private Long aprovadorFinanceiroId;
 @Column(name="titulo_id") private Long tituloId;
}
