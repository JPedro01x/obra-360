package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.EquipeTrabalhoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EquipeTrabalhoRepository extends JpaRepository<EquipeTrabalhoEntity, Long> {
    List<EquipeTrabalhoEntity> findByProjetoObraId(Long projetoObraId);
}
