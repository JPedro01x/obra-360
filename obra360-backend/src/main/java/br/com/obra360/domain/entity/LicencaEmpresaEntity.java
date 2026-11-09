package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="licenca_empresa") @Getter @Setter @NoArgsConstructor
public class LicencaEmpresaEntity {
    @Id @Column(name="empresa_id") private Long empresaId;
    @Column(nullable=false,length=40) private String plano="PILOTO";
    @Column(name="limite_usuarios",nullable=false) private int limiteUsuarios=50;
    @Column(name="limite_projetos",nullable=false) private int limiteProjetos=50;
    @Column(name="limite_modelos",nullable=false) private int limiteModelos=500;
}
