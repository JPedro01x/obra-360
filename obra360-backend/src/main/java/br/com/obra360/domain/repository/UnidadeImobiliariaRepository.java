package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.UnidadeImobiliariaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnidadeImobiliariaRepository extends JpaRepository<UnidadeImobiliariaEntity, Long> {
    List<UnidadeImobiliariaEntity> findByProjetoObraId(Long projetoObraId);
    Optional<UnidadeImobiliariaEntity> findByProjetoObraIdAndCodigoUnidade(Long projetoObraId, String codigoUnidade);
    List<UnidadeImobiliariaEntity> findByProjetoObraIdAndStatusVenda(Long projetoObraId, String statusVenda);
}
