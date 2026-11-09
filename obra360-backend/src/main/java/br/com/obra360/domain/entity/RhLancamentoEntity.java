package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_lancamento") @Getter @Setter @NoArgsConstructor
public class RhLancamentoEntity extends RhBase {
 @Column(name="folha_id",nullable=false) private Long folhaId;
 @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
 @Column(name="codigo",nullable=false,length=40) private String codigo;
 @Column(name="descricao",nullable=false,length=150) private String descricao;
 @Column(name="natureza",nullable=false,length=20) private String natureza;
 @Column(name="valor",nullable=false,precision=15,scale=2) private BigDecimal valor;
}
