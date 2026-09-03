package com.obra360.domain.factory;

import com.obra360.domain.entity.StockItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários: StockItemFactory (Factory Method Pattern)")
class StockItemFactoryTest {

    @Test
    @DisplayName("Deve criar insumo estrutural com limite crítico predefinido de 100 unidades")
    void shouldCreateStructuralItemWithDefaultMinStock() {
        StockItem item = StockItemFactory.createStructuralItem("CIM-30MPA", "Cimento Votoran 50kg", 200, "Votoran S/A");

        assertNotNull(item);
        assertEquals("Insumos Estruturais", item.getCategory());
        assertEquals(100, item.getMinStock());
        assertEquals("CIM-30MPA", item.getSku());
        assertFalse(item.isLowStock());
    }

    @Test
    @DisplayName("Deve identificar estoque baixo quando quantidade for menor que o mínimo crítico")
    void shouldDetectLowStock() {
        StockItem item = StockItemFactory.createStructuralItem("CIM-30MPA", "Cimento Votoran 50kg", 50, "Votoran S/A");
        assertTrue(item.isLowStock());
    }
}
