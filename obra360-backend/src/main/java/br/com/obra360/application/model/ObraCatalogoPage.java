package br.com.obra360.application.model;

import br.com.obra360.domain.model.ObraResumo;
import java.util.List;

public record ObraCatalogoPage(List<ObraResumo> items, long total, int page, int size) {
    public ObraCatalogoPage { items = List.copyOf(items); }
}
