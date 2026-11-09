package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_folha") @Getter @Setter @NoArgsConstructor
public class RhFolhaEntity extends RhBase {
 @Column(name="competencia",nullable=false,length=7) private String competencia;
 @Column(name="situacao",nullable=false,length=20) private String situacao;
 @Column(name="total_proventos",nullable=false,precision=17,scale=2) private BigDecimal totalProventos;
 @Column(name="total_descontos",nullable=false,precision=17,scale=2) private BigDecimal totalDescontos;
 @Column(name="data_pagamento") private LocalDate dataPagamento;
}
