package br.com.obra360.application.port.out;

import br.com.obra360.application.model.MedicaoFisicaItem;
import java.util.List;

/** Persistence boundary for the physical-measurement read flow. */
public interface MedicaoFisicaReadPort {
    boolean projectExists(Long tenantId, Long projectId);
    List<MedicaoFisicaItem> list(Long tenantId, Long projectId, int page, int size);
    long count(Long tenantId, Long projectId);
}
