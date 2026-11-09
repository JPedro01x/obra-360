package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity @Table(name="insumo_consumido_os")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ConsumoOrdemEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="ordem_servico_id",nullable=false) private Long ordemServicoId;
    @Column(name="item_estoque_id",nullable=false) private Long itemEstoqueId;
    @Column(name="quantidade_utilizada",nullable=false,precision=12,scale=3) private BigDecimal quantidadeUtilizada;
    @Column(name="custo_total_insumo",nullable=false,precision=12,scale=2) private BigDecimal custoTotalInsumo;
    @Column(name="data_consumo",nullable=false) private OffsetDateTime dataConsumo;
    @PrePersist void onCreate() { dataConsumo=OffsetDateTime.now(); }
}
