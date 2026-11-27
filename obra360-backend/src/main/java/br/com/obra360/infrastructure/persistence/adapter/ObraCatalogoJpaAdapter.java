package br.com.obra360.infrastructure.persistence.adapter;

import br.com.obra360.application.model.ObraCatalogoPage;
import br.com.obra360.application.port.out.ObraCatalogoReadPort;
import br.com.obra360.domain.model.ObraResumo;
import br.com.obra360.domain.entity.ProjetoObraEntity;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class ObraCatalogoJpaAdapter implements ObraCatalogoReadPort {
    private final EntityManager entityManager;

    public ObraCatalogoJpaAdapter(EntityManager entityManager) { this.entityManager = entityManager; }

    @Override
    public ObraCatalogoPage listar(Long empresaId, int page, int size) {
        List<ObraResumo> items = entityManager.createQuery(
            "select new br.com.obra360.domain.model.ObraResumo(e.id, e.nome, e.areaTotalM2, e.vgvEstimado, e.dataInicio, e.dataPrevisaoFim) " +
                "from ProjetoObraEntity e where e.empresaId = :empresa order by e.id desc", ObraResumo.class)
            .setParameter("empresa", empresaId).setFirstResult(page * size).setMaxResults(size).getResultList();
        long total = entityManager.createQuery("select count(e) from ProjetoObraEntity e where e.empresaId = :empresa", Long.class)
            .setParameter("empresa", empresaId).getSingleResult();
        return new ObraCatalogoPage(items, total, page, size);
    }
}
