package br.com.obra360.application.usecase;

import br.com.obra360.application.model.ObraCatalogoPage;
import br.com.obra360.application.port.out.ObraCatalogoReadPort;
import br.com.obra360.domain.model.ObraResumo;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ListObrasPorEmpresaTest {
    @Test void delegatesTenantAndPaginationAndReturnsPage() {
        var port = mock(ObraCatalogoReadPort.class);
        var expected = new ObraCatalogoPage(List.of(new ObraResumo(7L, "Obra", new BigDecimal("12.50"),
            new BigDecimal("300.00"), LocalDate.parse("2026-01-01"), LocalDate.parse("2026-12-31"))), 1L, 2, 10);
        when(port.listar(42L, 2, 10)).thenReturn(expected);
        var result = new ListObrasPorEmpresa(port).execute(42L, 2, 10);
        assertSame(expected, result);
        verify(port).listar(42L, 2, 10);
        verifyNoMoreInteractions(port);
    }

    @Test void rejectsInvalidTenantAndPaginationBeforeReading() {
        var port = mock(ObraCatalogoReadPort.class);
        var useCase = new ListObrasPorEmpresa(port);
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(0L, 0, 25));
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(1L, -1, 25));
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(1L, 0, 101));
        verifyNoInteractions(port);
    }
}
