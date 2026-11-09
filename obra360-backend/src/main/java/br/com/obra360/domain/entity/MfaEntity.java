package br.com.obra360.domain.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="usuario_mfa") @Getter @Setter @NoArgsConstructor
public class MfaEntity {
    @Id @Column(name="usuario_id") private Long usuarioId;
    @Column(name="segredo_cifrado",nullable=false,length=300) private String segredoCifrado;
    @Column(nullable=false) private boolean ativo;
    @Column(name="expira_em",nullable=false) private OffsetDateTime expiraEm;
    @Column(name="ultimo_contador",nullable=false) private long ultimoContador=-1;
    @Column(name="codigos_hash",nullable=false,length=1000) private String codigosHash="";
}
