package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name="item_pedido_materiais",uniqueConstraints=@UniqueConstraint(columnNames={"pedido_id","item_estoque_id"})) @Getter @Setter @NoArgsConstructor
public class ItemPedidoMateriaisEntity extends RegistroGestao {
 @Column(name="pedido_id",nullable=false) private Long pedidoId;
 @Column(name="item_estoque_id",nullable=false) private Long itemEstoqueId;
 @Column(nullable=false,precision=12,scale=4) private BigDecimal quantidade;
 @Column(name="valor_unitario",nullable=false,precision=12,scale=2) private BigDecimal valorUnitario;
 @Column(nullable=false,precision=12,scale=4) private BigDecimal recebida;
 @Column(nullable=false,precision=12,scale=4) private BigDecimal devolvida;
}
