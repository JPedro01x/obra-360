package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="evento_pedido",uniqueConstraints=@UniqueConstraint(columnNames={"empresa_id","chave"})) @Getter @Setter @NoArgsConstructor
public class EventoPedidoEntity extends RegistroGestao {
 @Column(name="pedido_id",nullable=false) private Long pedidoId;
 @Column(nullable=false,length=36) private String chave;
 @Column(nullable=false,length=10) private String tipo;
 @Column(nullable=false,length=64) private String assinatura;
 @Column(name="operador_id",nullable=false) private Long operadorId;
 @Column(nullable=false,length=1000) private String observacao;
 @Column(nullable=false,columnDefinition="TEXT") private String itens;
 @Column(name="credito_id") private Long creditoId;
}
