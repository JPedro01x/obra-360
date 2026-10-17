package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.EtapaCronogramaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EtapaCronogramaRepository extends JpaRepository<EtapaCronogramaEntity, Long> {
    List<EtapaCronogramaEntity> findByProjetoObraIdOrderByOrdemExecucaoAsc(Long projetoObraId);
}
