package br.com.obra360.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "empresa", indexes = {
    @Index(name = "idx_empresa_cnpj", columnList = "cnpj")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmpresaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cnpj", nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "razao_social", nullable = false, length = 150)
    private String razaoSocial;

    @Column(name = "nome_fantasia", nullable = false, length = 150)
    private String nomeFantasia;
    @Builder.Default
    @Column(name="ambiente_dados",nullable=false,length=20,columnDefinition="VARCHAR(20) DEFAULT 'OPERACAO'")
    private String ambienteDados="OPERACAO";

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private OffsetDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        if (dataCriacao == null) {
            dataCriacao = OffsetDateTime.now();
        }
    }
}
