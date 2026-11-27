package br.com.obra360.application.service;

import br.com.obra360.domain.entity.CotacaoB2BEntity;
import br.com.obra360.domain.entity.FornecedorB2BEntity;
import br.com.obra360.domain.repository.CotacaoB2BRepository;
import br.com.obra360.domain.repository.FornecedorB2BRepository;
import br.com.obra360.infrastructure.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@PreAuthorize("denyAll()") // Legacy entity-binding service; use tenant-validated workspace/portal workflows.
public class SuprimentosB2BService {

    private final FornecedorB2BRepository fornecedorRepository;
    private final CotacaoB2BRepository cotacaoRepository;
    private Long tenant() { return Objects.requireNonNull(TenantContext.getCurrentTenant()); }

    @Transactional
    public FornecedorB2BEntity cadastrarFornecedor(FornecedorB2BEntity fornecedor) {
        return fornecedorRepository.save(fornecedor);
    }

    @Transactional(readOnly = true)
    public List<FornecedorB2BEntity> listarFornecedoresPorCategoria(String categoria) {
        return fornecedorRepository.findByEmpresaIdAndCategoriaFornecimento(tenant(),categoria);
    }

    @Transactional
    public CotacaoB2BEntity submeterCotacao(CotacaoB2BEntity cotacao) {
        if (cotacao.getCodigoCotacao() == null || cotacao.getCodigoCotacao().isBlank()) {
            cotacao.setCodigoCotacao("COT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return cotacaoRepository.save(cotacao);
    }

    @Transactional(readOnly = true)
    public List<CotacaoB2BEntity> listarCotacoesPorEmpresa() {
        return cotacaoRepository.findByEmpresaId(tenant());
    }
}
