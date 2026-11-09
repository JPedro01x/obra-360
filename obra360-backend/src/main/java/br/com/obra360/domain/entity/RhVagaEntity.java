package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_vaga") @Getter @Setter @NoArgsConstructor
public class RhVagaEntity extends RhBase {
 @Column(name="titulo",nullable=false,length=150) private String titulo;
 @Column(name="departamento_id",nullable=false) private Long departamentoId;
 @Column(name="cargo_id",nullable=false) private Long cargoId;
 @Column(name="quantidade",nullable=false) private Integer quantidade;
 @Column(name="descricao",nullable=false,length=2000) private String descricao;
 @Column(name="abertura",nullable=false) private LocalDate abertura;
 @Column(name="situacao",nullable=false,length=20) private String situacao;
}
