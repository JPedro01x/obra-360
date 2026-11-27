package br.com.obra360.application.model;

import java.util.List;

public record MedicaoFisicaPage(List<MedicaoFisicaItem> items, long total, int page, int size) {
    public MedicaoFisicaPage { items = List.copyOf(items); }
}
