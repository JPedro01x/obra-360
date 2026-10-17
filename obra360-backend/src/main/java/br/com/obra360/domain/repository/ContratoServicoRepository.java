package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.ContratoServicoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContratoServicoRepository extends JpaRepository<ContratoServicoEntity, Long> {
    List<ContratoServicoEntity> findByEmpresaId(Long empresaId);
    List<ContratoServicoEntity> findByProjetoObraId(Long projetoObraId);
    List<ContratoServicoEntity> findByFornecedorB2bId(Long fornecedorB2bId);
}
