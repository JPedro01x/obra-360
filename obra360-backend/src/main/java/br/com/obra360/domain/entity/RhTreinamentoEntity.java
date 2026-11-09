package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_treinamento") @Getter @Setter @NoArgsConstructor
public class RhTreinamentoEntity extends RhBase {
 @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
 @Column(name="tipo",nullable=false,length=20) private String tipo;
 @Column(name="titulo",nullable=false,length=150) private String titulo;
 @Column(name="realizacao",nullable=false) private LocalDate realizacao;
 @Column(name="validade") private LocalDate validade;
 @Column(name="carga_horaria_minutos",nullable=false) private Integer cargaHorariaMinutos;
 @Column(name="instituicao",length=150) private String instituicao;
 @Column(name="observacao",length=500) private String observacao;
}
