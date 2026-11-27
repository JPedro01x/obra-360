package br.com.obra360.application.usecase;

import br.com.obra360.application.model.MedicaoFisicaPage;
import br.com.obra360.application.port.out.MedicaoFisicaReadPort;

public class ListMedicoesFisicas {
    public static final int PAGE_SIZE = 25;
    private final MedicaoFisicaReadPort readPort;

    public ListMedicoesFisicas(MedicaoFisicaReadPort readPort) { this.readPort = readPort; }

    public MedicaoFisicaPage execute(Long tenantId, Long projectId, int page) {
        if (tenantId == null || tenantId < 1 || projectId == null || projectId < 1 || page < 0 || page > 100_000)
            throw new IllegalArgumentException("Empresa, projeto e página devem ser válidos.");
        if (!readPort.projectExists(tenantId, projectId)) throw new ProjectNotFoundException();
        return new MedicaoFisicaPage(
            readPort.list(tenantId, projectId, page, PAGE_SIZE),
            readPort.count(tenantId, projectId), page, PAGE_SIZE
        );
    }
}
