package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.math.BigDecimal;
@Entity @Table(name="rh_funcionario") @Getter @Setter @NoArgsConstructor
public class RhFuncionarioEntity extends RhBase {
 @Column(name="matricula",nullable=false,length=30) private String matricula;
 @Column(name="nome",nullable=false,length=150) private String nome;
 @Column(name="cpf",nullable=false,length=11) private String cpf;
 @Column(name="email",length=120) private String email;
 @Column(name="telefone",length=30) private String telefone;
 @Column(name="nascimento") private LocalDate nascimento;
 @Column(name="admissao",nullable=false) private LocalDate admissao;
 @Column(name="desligamento") private LocalDate desligamento;
 @Column(name="vinculo",nullable=false,length=20) private String vinculo;
 @Column(name="situacao",nullable=false,length=20) private String situacao;
 @Column(name="departamento_id",nullable=false) private Long departamentoId;
 @Column(name="cargo_id",nullable=false) private Long cargoId;
 @Column(name="projeto_obra_id") private Long projetoObraId;
 @Column(name="equipe_id") private Long equipeId;
 @Column(name="usuario_id") private Long usuarioId;
 @Column(name="salario_base",nullable=false,precision=15,scale=2) private BigDecimal salarioBase;
 @Column(name="jornada_semanal_minutos",nullable=false) private Integer jornadaSemanalMinutos;
}
