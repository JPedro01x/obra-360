package com.obra360.domain.factory;

import com.obra360.domain.entity.StockItem;

/**
 * GOF DESIGN PATTERN: FACTORY METHOD
 * Encapsula a criação de itens de estoque com regras de negócio e limites de segurança pré-definidos
 */
public class StockItemFactory {

    public static StockItem createStructuralItem(String sku, String name, int initialQuantity, String supplier) {
        return new StockItem(
                "STK-" + System.currentTimeMillis(),
                sku,
                name,
                "Insumos Estruturais",
                initialQuantity,
                "Sacos / Toneladas",
                100, // Limite crítico para materiais estruturais (Cimento/Aço)
                supplier
        );
    }

    public static StockItem createElectricalItem(String sku, String name, int initialQuantity, String supplier) {
        return new StockItem(
                "STK-" + System.currentTimeMillis(),
                sku,
                name,
                "Instalações Elétricas",
                initialQuantity,
                "Metros / Caixas",
                30, // Limite crítico para fios/cabos
                supplier
        );
    }

    public static StockItem createHydraulicItem(String sku, String name, int initialQuantity, String supplier) {
        return new StockItem(
                "STK-" + System.currentTimeMillis(),
                sku,
                name,
                "Instalações Hidráulicas",
                initialQuantity,
                "Tubos / Peças",
                25, // Limite crítico para conexões PVC/Cobre
                supplier
        );
    }
}
