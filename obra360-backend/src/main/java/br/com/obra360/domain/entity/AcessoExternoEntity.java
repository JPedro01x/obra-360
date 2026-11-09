package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="acesso_externo") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AcessoExternoEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="empresa_id",nullable=false) private Long empresaId;
    @Column(name="usuario_id",nullable=false) private Long usuarioId;
    @Column(nullable=false,length=30) private String perfil;
    @Column(name="projeto_obra_id",nullable=false) private Long projetoObraId;
    @Column(name="unidade_imobiliaria_id") private Long unidadeImobiliariaId;
    @Column(name="fornecedor_b2b_id") private Long fornecedorB2bId;
}
