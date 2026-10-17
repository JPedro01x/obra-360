package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.LogAuditoriaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoriaEntity, Long> {
    List<LogAuditoriaEntity> findByEmpresaId(Long empresaId);
    List<LogAuditoriaEntity> findByUsuarioId(Long usuarioId);
}
