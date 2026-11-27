package br.com.obra360.infrastructure.persistence;

import br.com.obra360.application.model.MedicaoFisicaItem;
import br.com.obra360.application.port.out.MedicaoFisicaReadPort;
import br.com.obra360.domain.entity.MedicaoFisicaEntity;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class MedicaoFisicaJpaReadAdapter implements MedicaoFisicaReadPort {
    private final EntityManager em;

    @Override public boolean projectExists(Long tenantId, Long projectId) {
        return em.createQuery("select count(p) from ProjetoObraEntity p where p.id=:p and p.empresaId=:t", Long.class)
            .setParameter("p", projectId).setParameter("t", tenantId).getSingleResult() > 0;
    }

    @Override public List<MedicaoFisicaItem> list(Long tenantId, Long projectId, int page, int size) {
        return em.createQuery("select m from MedicaoFisicaEntity m where m.empresaId=:t and m.projetoObraId=:p order by m.competencia desc,m.id desc", MedicaoFisicaEntity.class)
            .setParameter("t", tenantId).setParameter("p", projectId)
            .setFirstResult(Math.multiplyExact(page, size)).setMaxResults(size).getResultList()
            .stream().map(MedicaoFisicaJpaReadAdapter::toItem).toList();
    }

    @Override public long count(Long tenantId, Long projectId) {
        return em.createQuery("select count(m) from MedicaoFisicaEntity m where m.empresaId=:t and m.projetoObraId=:p", Long.class)
            .setParameter("t", tenantId).setParameter("p", projectId).getSingleResult();
    }

    private static MedicaoFisicaItem toItem(MedicaoFisicaEntity m) {
        return new MedicaoFisicaItem(m.getId(), m.getEmpresaId(), m.getProjetoObraId(), m.getEtapaCronogramaId(),
            m.getCompetencia(), m.getDescricao(), m.getQuantidade(), m.getUnidade(), m.getPercentualAnterior(),
            m.getPercentualMedido(), m.getValorMedido(), m.getStatus(), m.getCriadoPor(), m.getAprovadoPor(),
            m.getLiberadoPor(), m.getCriadoEm(), m.getAtualizadoEm());
    }
}
