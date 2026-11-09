package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="rh_historico") @Getter @Setter @NoArgsConstructor
@org.hibernate.annotations.Immutable
public class RhHistoricoEntity extends RhBase {
    @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(nullable=false,length=30) private String tipo;
    @Column(nullable=false,length=500) private String motivo;
    @Column(name="data_referencia",nullable=false) private LocalDate dataReferencia;
    @Column(name="campos_alterados",nullable=false,length=500) private String camposAlterados;
    @Column(name="estado_anterior",columnDefinition="TEXT") private String estadoAnterior;
    @Column(name="estado_atual",nullable=false,columnDefinition="TEXT") private String estadoAtual;
}
