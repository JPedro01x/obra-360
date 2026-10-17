package br.com.obra360.application.service;

import br.com.obra360.domain.entity.GarantiaPosVendaEntity;
import br.com.obra360.domain.entity.UnidadeImobiliariaEntity;
import br.com.obra360.domain.repository.GarantiaPosVendaRepository;
import br.com.obra360.domain.repository.UnidadeImobiliariaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendasImobiliariasServiceTest {

    @Mock
    private UnidadeImobiliariaRepository unidadeRepository;

    @Mock
    private GarantiaPosVendaRepository garantiaRepository;

    @InjectMocks
    private VendasImobiliariasService vendasService;

    private UnidadeImobiliariaEntity unidadeExemplo;
    private GarantiaPosVendaEntity garantiaExemplo;

    @BeforeEach
    void setUp() {
        unidadeExemplo = UnidadeImobiliariaEntity.builder()
                .id(1L)
                .projetoObraId(10L)
                .codigoUnidade("APTO-101")
                .areaPrivativaM2(new BigDecimal("75.5000"))
                .valorTabela(new BigDecimal("450000.00"))
                .statusVenda("DISPONIVEL")
                .sistemaAmortizacao("PRICE")
                .indiceCorrecao("INCC")
                .build();

        garantiaExemplo = GarantiaPosVendaEntity.builder()
                .id(1L)
                .unidadeImobiliariaId(1L)
                .usuarioClienteId(5L)
                .codigoChamado("GAR-12345678")
                .categoriaDefeito("INFILTRACAO")
                .descricaoDefeito("Vazamento no banheiro social")
                .statusChamado("ABERTO")
                .build();
    }

    @Test
    @DisplayName("Deve cadastrar unidade imobiliária com sucesso")
    void deveCadastrarUnidadeImobiliaria() {
        when(unidadeRepository.save(any())).thenReturn(unidadeExemplo);

        UnidadeImobiliariaEntity salva = vendasService.cadastrarUnidade(unidadeExemplo);

        assertNotNull(salva);
        assertEquals("APTO-101", salva.getCodigoUnidade());
        assertEquals(new BigDecimal("450000.00"), salva.getValorTabela());
        verify(unidadeRepository, times(1)).save(unidadeExemplo);
    }

    @Test
    @DisplayName("Deve listar unidades por projeto de obra")
    void deveListarUnidadesPorProjeto() {
        when(unidadeRepository.findByProjetoObraId(10L)).thenReturn(List.of(unidadeExemplo));

        List<UnidadeImobiliariaEntity> resultado = vendasService.listarUnidadesPorProjeto(10L);

        assertFalse(resultado.isEmpty());
        assertEquals(1, resultado.size());
        assertEquals("APTO-101", resultado.get(0).getCodigoUnidade());
    }

    @Test
    @DisplayName("Deve abrir chamado de garantia pós-venda gerando protocolo caso ausente")
    void deveAbrirChamadoGarantiaComProtocolo() {
        GarantiaPosVendaEntity semCodigo = GarantiaPosVendaEntity.builder()
                .unidadeImobiliariaId(1L)
                .usuarioClienteId(5L)
                .categoriaDefeito("ELETRICA")
                .descricaoDefeito("Disjuntor caindo")
                .build();

        when(garantiaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        GarantiaPosVendaEntity resultado = vendasService.abrirChamadoGarantia(semCodigo);

        assertNotNull(resultado);
        assertNotNull(resultado.getCodigoChamado());
        assertTrue(resultado.getCodigoChamado().startsWith("GAR-"));
        verify(garantiaRepository, times(1)).save(semCodigo);
    }
}
