package br.com.obra360.application.service;

import br.com.obra360.domain.entity.CotacaoB2BEntity;
import br.com.obra360.domain.entity.FornecedorB2BEntity;
import br.com.obra360.domain.repository.CotacaoB2BRepository;
import br.com.obra360.domain.repository.FornecedorB2BRepository;
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
class SuprimentosB2BServiceTest {

    @Mock
    private FornecedorB2BRepository fornecedorRepository;

    @Mock
    private CotacaoB2BRepository cotacaoRepository;

    @InjectMocks
    private SuprimentosB2BService suprimentosService;

    private FornecedorB2BEntity fornecedor;

    @BeforeEach
    void setUp() {
        fornecedor = FornecedorB2BEntity.builder()
                .id(1L)
                .cnpj("12345678000199")
                .razaoSocial("Cimento & Aço S.A.")
                .categoriaFornecimento("INSUMOS")
                .statusHomologacao("HOMOLOGADO")
                .scoreReputacao(new BigDecimal("4.95"))
                .build();
    }

    @Test
    @DisplayName("Deve cadastrar fornecedor B2B com sucesso")
    void deveCadastrarFornecedor() {
        when(fornecedorRepository.save(any())).thenReturn(fornecedor);

        FornecedorB2BEntity salvo = suprimentosService.cadastrarFornecedor(fornecedor);

        assertNotNull(salvo);
        assertEquals("12345678000199", salvo.getCnpj());
        verify(fornecedorRepository, times(1)).save(fornecedor);
    }

    @Test
    @DisplayName("Deve submeter cotação B2B gerando código de cotação")
    void deveSubmeterCotacaoComCodigo() {
        CotacaoB2BEntity cotacao = CotacaoB2BEntity.builder()
                .empresaId(10L)
                .fornecedorB2bId(1L)
                .valorProposta(new BigDecimal("15000.00"))
                .prazoEntregaDias(5)
                .build();

        when(cotacaoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CotacaoB2BEntity resultado = suprimentosService.submeterCotacao(cotacao);

        assertNotNull(resultado);
        assertNotNull(resultado.getCodigoCotacao());
        assertTrue(resultado.getCodigoCotacao().startsWith("COT-"));
    }
}
