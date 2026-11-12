package br.com.obra360.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="evidencia_qualidade") @Getter @Setter @NoArgsConstructor
public class EvidenciaQualidadeEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="ocorrencia_id",nullable=false) private Long ocorrenciaId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @JsonIgnore @Column(name="arquivo_key",nullable=false,length=50) private String arquivoKey;
    @Column(nullable=false,length=64) private String sha256;
    @Column(nullable=false,length=30) private String mime;
    @Column(nullable=false) private long tamanho;
    @Column(name="data_criacao",nullable=false) private OffsetDateTime dataCriacao;
}
