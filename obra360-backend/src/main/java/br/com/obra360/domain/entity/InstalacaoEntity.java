package br.com.obra360.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "instalacao")
@NoArgsConstructor
public class InstalacaoEntity {
    @Id private Long id;
    public InstalacaoEntity(Long id) { this.id = id; }
}
