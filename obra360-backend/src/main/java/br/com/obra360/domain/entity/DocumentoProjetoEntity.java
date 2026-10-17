package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "documento_projeto", indexes = {
    @Index(name = "idx_documento_projeto", columnList = "projeto_obra_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoProjetoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projeto_obra_id", nullable = false)
    private Long projetoObraId;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "tipo_documento", nullable = false, length = 50)
    private String tipoDocumento; // 'PRANCHA_DWG', 'MEMORIAL_PDF', 'ALVARA'

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    private String nomeArquivo;

    @Column(name = "url_armazenamento", nullable = false, length = 500)
    private String urlArmazenamento;

    @Column(name = "hash_arquivo_sha256", nullable = false, length = 64)
    private String hashArquivoSha256;

    @Column(name = "versao", nullable = false)
    private Integer versao;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
        if (versao == null) {
            versao = 1;
        }
    }
}
