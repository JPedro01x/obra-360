package br.com.obra360.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

@Entity @Table(name = "modelo_referencia") @Immutable
@Getter @Setter @NoArgsConstructor
public class ModeloReferenciaEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore @Column(name = "empresa_id", nullable = false)
    private Long empresaId;
    @JsonIgnore @Column(name = "arquivo_key", nullable = false, length = 40)
    private String arquivoKey;
    @Column(name = "nome_arquivo", nullable = false)
    private String nomeArquivo;
    @Column(nullable = false, length = 64)
    private String sha256;
    @Column(name = "pavimento_id", nullable = false, length = 64)
    private String pavimentoId;
    @Column(nullable = false)
    private int pagina;
    @Column(nullable = false)
    private double x;
    @Column(nullable = false)
    private double z;
    @Column(nullable = false)
    private double largura;
    @Column(nullable = false)
    private double altura;
    @Column(nullable = false)
    private boolean calibrada;
}
