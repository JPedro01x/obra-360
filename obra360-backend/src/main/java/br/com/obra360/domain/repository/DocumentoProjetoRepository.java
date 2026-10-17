package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.DocumentoProjetoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentoProjetoRepository extends JpaRepository<DocumentoProjetoEntity, Long> {
    List<DocumentoProjetoEntity> findByProjetoObraId(Long projetoObraId);
    List<DocumentoProjetoEntity> findByProjetoObraIdAndTipoDocumento(Long projetoObraId, String tipoDocumento);
}
