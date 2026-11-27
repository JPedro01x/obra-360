package br.com.obra360.application.usecase;

import br.com.obra360.application.model.ObraCatalogoPage;
import br.com.obra360.application.port.out.ObraCatalogoReadPort;

public class ListObrasPorEmpresa {
    private final ObraCatalogoReadPort readPort;

    public ListObrasPorEmpresa(ObraCatalogoReadPort readPort) { this.readPort = readPort; }

    public ObraCatalogoPage execute(Long empresaId, int page, int size) {
        if (empresaId == null || empresaId < 1 || page < 0 || page > 1_000_000 || size < 1 || size > 100)
            throw new IllegalArgumentException("Empresa e paginação devem ser válidas.");
        return readPort.listar(empresaId, page, size);
    }
}
