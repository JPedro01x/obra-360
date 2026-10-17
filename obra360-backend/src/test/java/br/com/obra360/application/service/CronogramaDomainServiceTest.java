package br.com.obra360.application.service;

import br.com.obra360.domain.entity.EtapaCronogramaEntity;
import br.com.obra360.domain.repository.EtapaCronogramaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CronogramaDomainServiceTest {

    @Mock
    private EtapaCronogramaRepository etapaRepository;

    @InjectMocks
    private CronogramaDomainService cronogramaService;

    private EtapaCronogramaEntity etapa1;
    private EtapaCronogramaEntity etapa2;

    @BeforeEach
    void setUp() {
        etapa1 = EtapaCronogramaEntity.builder()
                .id(1L)
                .projetoObraId(10L)
                .nomeEtapa("Fundação e Estacas")
                .ordemExecucao(1)
                .dataInicioPrevista(LocalDate.now())
                .dataFimPrevista(LocalDate.now().plusDays(30))
                .percentualExecutado(new BigDecimal("100.00"))
                .build();

        etapa2 = EtapaCronogramaEntity.builder()
                .id(2L)
                .projetoObraId(10L)
                .nomeEtapa("Estrutura e Lajes")
                .ordemExecucao(2)
                .dataInicioPrevista(LocalDate.now().plusDays(30))
                .dataFimPrevista(LocalDate.now().plusDays(90))
                .percentualExecutado(new BigDecimal("50.00"))
                .build();
    }

    @Test
    @DisplayName("Deve calcular o progresso geral médio do projeto corretamente")
    void deveCalcularProgressoGeralProjeto() {
        when(etapaRepository.findByProjetoObraIdOrderByOrdemExecucaoAsc(10L))
                .thenReturn(List.of(etapa1, etapa2));

        BigDecimal progressoGeral = cronogramaService.calcularProgressoGeralProjeto(10L);

        assertNotNull(progressoGeral);
        assertEquals(new BigDecimal("75.00"), progressoGeral); // (100 + 50) / 2 = 75
    }

    @Test
    @DisplayName("Deve atualizar o progresso de uma etapa com sucesso")
    void deveAtualizarProgressoEtapa() {
        when(etapaRepository.findById(1L)).thenReturn(Optional.of(etapa1));
        when(etapaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EtapaCronogramaEntity atualizada = cronogramaService.atualizarProgressoEtapa(1L, new BigDecimal("80.00"));

        assertNotNull(atualizada);
        assertEquals(new BigDecimal("80.00"), atualizada.getPercentualExecutado());
    }
}
