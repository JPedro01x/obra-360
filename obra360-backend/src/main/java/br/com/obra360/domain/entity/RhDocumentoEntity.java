package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="rh_documento") @Getter @Setter @NoArgsConstructor
public class RhDocumentoEntity extends RhBase {
    @Column(name="funcionario_id",nullable=false) private Long funcionarioId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(nullable=false,length=36) private String grupo;
    @Column(name="numero_versao",nullable=false) private Integer numeroVersao;
    @Column(name="documento_anterior_id") private Long documentoAnteriorId;
    @Column(nullable=false,length=150) private String titulo;
    @Column(nullable=false,length=30) private String categoria;
    @Column(name="nome_arquivo",nullable=false,length=255) private String nomeArquivo;
    @Column(name="tipo_arquivo",nullable=false,length=50) private String tipoArquivo;
    @Column(nullable=false) private Long tamanho;
    @Column(name="sha256",nullable=false,length=64) private String sha256;
    @Column(name="referencia_arquivo",nullable=false,length=50)
    @com.fasterxml.jackson.annotation.JsonIgnore private String referenciaArquivo;
    @Column(name="data_validade") private LocalDate dataValidade;
    @Column(nullable=false) private Boolean arquivado;
}
