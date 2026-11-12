package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity @Table(name="requisicao_compra") @Getter @Setter @NoArgsConstructor
public class RequisicaoCompraEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="item_estoque_id",nullable=false) private Long itemEstoqueId;
    @Column(name="solicitante_id",nullable=false) private Long solicitanteId;
    @Column(nullable=false,precision=12,scale=4) private BigDecimal quantidade;
    @Column(nullable=false,length=1000) private String justificativa;
    @Column(nullable=false,length=30) private String status;
    @Column(name="cotacao_selecionada_id") private Long cotacaoSelecionadaId;
    @Column(name="aprovador_gestao_id") private Long aprovadorGestaoId;
    @Column(name="aprovador_financeiro_id") private Long aprovadorFinanceiroId;
    @Column(name="numero_pedido",length=50) private String numeroPedido;
    @Column(name="movimentacao_id") private Long movimentacaoId;
    @Column(name="data_criacao",nullable=false) private OffsetDateTime dataCriacao;
    @Column(name="data_recebimento") private OffsetDateTime dataRecebimento;
}
