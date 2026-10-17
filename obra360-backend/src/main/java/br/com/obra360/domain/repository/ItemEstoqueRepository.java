package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.ItemEstoqueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemEstoqueRepository extends JpaRepository<ItemEstoqueEntity, Long> {

    Optional<ItemEstoqueEntity> findByEmpresaIdAndSku(Long empresaId, String sku);
}
