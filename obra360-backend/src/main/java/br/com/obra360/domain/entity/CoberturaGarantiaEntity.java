package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="cobertura_garantia",uniqueConstraints=@UniqueConstraint(columnNames={"unidade_id","categoria"}))
@Getter @Setter @NoArgsConstructor
public class CoberturaGarantiaEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="unidade_id",nullable=false) private Long unidadeId;
    @Column(nullable=false,length=50) private String categoria;
    @Column(name="data_inicio",nullable=false) private LocalDate dataInicio;
    @Column(name="data_fim",nullable=false) private LocalDate dataFim;
    @Column(nullable=false,length=1000) private String descricao;
    @Column(nullable=false) private boolean ativo;
}
