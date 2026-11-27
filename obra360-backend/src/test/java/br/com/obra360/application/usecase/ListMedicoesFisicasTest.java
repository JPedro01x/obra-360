package br.com.obra360.application.usecase;

import br.com.obra360.application.model.MedicaoFisicaPage;
import br.com.obra360.application.port.out.MedicaoFisicaReadPort;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ListMedicoesFisicasTest {
    private final MedicaoFisicaReadPort readPort = mock(MedicaoFisicaReadPort.class);
    private final ListMedicoesFisicas useCase = new ListMedicoesFisicas(readPort);

    @Test void returnsRequestedOwnedProjectPage() {
        when(readPort.projectExists(7L, 42L)).thenReturn(true);
        when(readPort.list(7L, 42L, 2, 25)).thenReturn(List.of());
        when(readPort.count(7L, 42L)).thenReturn(51L);

        MedicaoFisicaPage result = useCase.execute(7L, 42L, 2);

        assertEquals(51L, result.total());
        assertEquals(2, result.page());
        assertEquals(25, result.size());
        assertTrue(result.items().isEmpty());
        verify(readPort).list(7L, 42L, 2, 25);
    }

    @Test void hidesMissingAndForeignProjectsAsNotFound() {
        when(readPort.projectExists(7L, 99L)).thenReturn(false);
        assertThrows(ProjectNotFoundException.class, () -> useCase.execute(7L, 99L, 0));
        verify(readPort, never()).list(anyLong(), anyLong(), anyInt(), anyInt());
        verify(readPort, never()).count(anyLong(), anyLong());
    }

    @Test void rejectsInvalidInputsBeforeCallingPort() {
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(0L, 42L, 0));
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(7L, 42L, -1));
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(7L, 42L, 100_001));
        verifyNoInteractions(readPort);
    }
}
