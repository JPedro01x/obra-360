package br.com.obra360.application.port.out;

import br.com.obra360.application.model.ObraCatalogoPage;

/** Reads a page of projects already scoped to the authenticated company. */
public interface ObraCatalogoReadPort {
    ObraCatalogoPage listar(Long empresaId, int page, int size);
}
