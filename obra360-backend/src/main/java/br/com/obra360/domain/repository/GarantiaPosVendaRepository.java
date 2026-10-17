package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.GarantiaPosVendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GarantiaPosVendaRepository extends JpaRepository<GarantiaPosVendaEntity, Long> {
    List<GarantiaPosVendaEntity> findByUnidadeImobiliariaId(Long unidadeImobiliariaId);
    List<GarantiaPosVendaEntity> findByUsuarioClienteId(Long usuarioClienteId);
    Optional<GarantiaPosVendaEntity> findByCodigoChamado(String codigoChamado);
}
