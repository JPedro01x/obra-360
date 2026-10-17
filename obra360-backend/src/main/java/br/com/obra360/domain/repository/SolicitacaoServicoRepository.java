package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.SolicitacaoServicoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoServicoRepository extends JpaRepository<SolicitacaoServicoEntity, Long> {
    List<SolicitacaoServicoEntity> findByContratoServicoId(Long contratoServicoId);
    Optional<SolicitacaoServicoEntity> findByCodigoProtocolo(String codigoProtocolo);
}
