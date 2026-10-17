package br.com.obra360.application.service;

import br.com.obra360.domain.entity.ItemEstoqueEntity;
import br.com.obra360.domain.entity.MovimentacaoEstoqueEntity;
import br.com.obra360.domain.exception.NfeInvalidaException;
import br.com.obra360.domain.exception.RecursoNaoEncontradoException;
import br.com.obra360.domain.repository.ItemEstoqueRepository;
import br.com.obra360.domain.repository.MovimentacaoEstoqueRepository;
import br.com.obra360.domain.service.ValidadorSefazDomainService;
import br.com.obra360.infrastructure.security.TenantContext;
import br.com.obra360.infrastructure.web.dto.EntradaNfeDTO;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class EstoqueService {

    private final ItemEstoqueRepository itemEstoqueRepository;
    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
    private final ValidadorSefazDomainService validadorSefazDomainService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public EstoqueService(ItemEstoqueRepository itemEstoqueRepository,
                          MovimentacaoEstoqueRepository movimentacaoEstoqueRepository,
                          ValidadorSefazDomainService validadorSefazDomainService,
                          KafkaTemplate<String, Object> kafkaTemplate) {
        this.itemEstoqueRepository = itemEstoqueRepository;
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
        this.validadorSefazDomainService = validadorSefazDomainService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public MovimentacaoEstoqueEntity processarEntradaNfe(EntradaNfeDTO dto, Long usuarioId) {
        Long tenantId = TenantContext.getCurrentTenant();

        // 1. Executa Validação Matemática Módulo 11 da SEFAZ para NFe de 44 dígitos
        boolean chaveValida = validadorSefazDomainService.validarChaveNfe44Digitos(dto.chaveNfe44Digitos());
        if (!chaveValida) {
            throw new NfeInvalidaException("A chave NFe de 44 dígitos '" + dto.chaveNfe44Digitos() + "' é inválida perante a SEFAZ (Falha no Dígito Verificador Módulo 11).");
        }

        // 2. Busca item no estoque respeitando isolamento Multi-Tenant por empresa_id
        ItemEstoqueEntity item = itemEstoqueRepository.findByEmpresaIdAndSku(tenantId, dto.sku())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de SKU '" + dto.sku() + "' não encontrado para esta empresa."));

        // 3. Atualiza saldo de estoque no PostgreSQL (ACID Transaction)
        BigDecimal novoSaldo = item.getQuantidadeAtual().add(dto.quantidade());
        item.setQuantidadeAtual(novoSaldo);
        itemEstoqueRepository.save(item);

        // 4. Registra movimentação de entrada
        MovimentacaoEstoqueEntity movimentacao = MovimentacaoEstoqueEntity.builder()
                .itemEstoqueId(item.getId())
                .usuarioId(usuarioId)
                .tipoMovimentacao("ENTRADA_NFE")
                .quantidade(dto.quantidade())
                .valorTotal(dto.valorTotal())
                .chaveNfe44Digitos(dto.chaveNfe44Digitos())
                .build();
        MovimentacaoEstoqueEntity movimentacaoSalva = movimentacaoEstoqueRepository.save(movimentacao);

        // 5. Dispara evento assíncrono no Apache Kafka para processamento de Auditoria NoSQL (MongoDB)
        try {
            Map<String, Object> evento = Map.of(
                    "evento", "EstoqueAtualizadoEvent",
                    "empresa_id", tenantId,
                    "item_id", item.getId(),
                    "sku", item.getSku(),
                    "novo_saldo", novoSaldo,
                    "chave_nfe", dto.chaveNfe44Digitos()
            );
            kafkaTemplate.send("obra360.estoque.eventos", item.getSku(), evento);
        } catch (Exception e) {
            // Em dev, ignora se Kafka não estiver rodando; em produção segue via DLQ
        }

        return movimentacaoSalva;
    }
}
