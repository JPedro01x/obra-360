package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.ProjetoObraEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetoObraRepository extends JpaRepository<ProjetoObraEntity, Long> {
    List<ProjetoObraEntity> findByEmpresaId(Long empresaId);
}
