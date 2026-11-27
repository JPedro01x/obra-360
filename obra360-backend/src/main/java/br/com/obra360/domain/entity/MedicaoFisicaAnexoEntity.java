package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name="medicao_fisica_anexo", indexes={
    @Index(name="idx_medicao_anexo_tenant_medicao", columnList="empresa_id, medicao_id, criado_em")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicaoFisicaAnexoEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="medicao_id",nullable=false) private Long medicaoId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(name="nome_arquivo",nullable=false,length=255) private String nomeArquivo;
    @Column(name="arquivo_key",nullable=false,length=64,unique=true) private String arquivoKey;
    @Column(name="sha256",nullable=false,length=64) private String sha256;
    @Column(name="mime",nullable=false,length=40) private String mime;
    @Column(name="tamanho",nullable=false) private Long tamanho;
    @Column(name="criado_em",nullable=false,updatable=false) private OffsetDateTime criadoEm;
    @PrePersist void create(){if(criadoEm==null)criadoEm=OffsetDateTime.now();}
}
