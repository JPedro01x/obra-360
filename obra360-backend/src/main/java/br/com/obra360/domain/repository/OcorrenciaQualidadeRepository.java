package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.OcorrenciaQualidadeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OcorrenciaQualidadeRepository extends JpaRepository<OcorrenciaQualidadeEntity, Long> {
    List<OcorrenciaQualidadeEntity> findByProjetoObraId(Long projetoObraId);
    List<OcorrenciaQualidadeEntity> findByResponsavelId(Long responsavelId);
}
