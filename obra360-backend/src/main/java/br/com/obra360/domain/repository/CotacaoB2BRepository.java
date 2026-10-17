package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.CotacaoB2BEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CotacaoB2BRepository extends JpaRepository<CotacaoB2BEntity, Long> {
    List<CotacaoB2BEntity> findByEmpresaId(Long empresaId);
    List<CotacaoB2BEntity> findByFornecedorB2bId(Long fornecedorB2bId);
}
