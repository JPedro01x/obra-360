package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "documento_nfe", uniqueConstraints = @UniqueConstraint(
    name = "uk_documento_nfe_empresa_chave", columnNames = {"empresa_id", "chave_nfe"}
), indexes = @Index(name = "idx_documento_nfe_empresa_data", columnList = "empresa_id, criado_em"))
@Getter
@Setter
@NoArgsConstructor
public class NfeDocumentoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private EmpresaEntity empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private FornecedorB2BEntity fornecedor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criado_por", nullable = false)
    private UsuarioEntity criadoPor;

    @Column(name = "chave_nfe", nullable = false, length = 44)
    private String chaveNfe;

    @Column(name = "numero", nullable = false, length = 30)
    private String numero;

    @Column(name = "data_emissao", nullable = false)
    private LocalDate dataEmissao;

    @Column(name = "valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "criado_em", nullable = false, updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime criadoEm;

    @PrePersist
    protected void onCreate() {
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
        if (status == null) status = "PENDENTE_CONFERENCIA";
    }
}
