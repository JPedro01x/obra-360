package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.FornecedorB2BEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FornecedorB2BRepository extends JpaRepository<FornecedorB2BEntity, Long> {
    Optional<FornecedorB2BEntity> findByCnpj(String cnpj);
    List<FornecedorB2BEntity> findByCategoriaFornecimento(String categoriaFornecimento);
}
