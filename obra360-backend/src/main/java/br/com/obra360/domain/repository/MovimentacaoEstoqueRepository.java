package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.MovimentacaoEstoqueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoqueEntity, Long> {

    List<MovimentacaoEstoqueEntity> findByChaveNfe44Digitos(String chaveNfe44Digitos);
}
