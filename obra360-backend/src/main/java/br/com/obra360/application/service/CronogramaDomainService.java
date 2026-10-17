package br.com.obra360.application.service;

import br.com.obra360.domain.entity.EtapaCronogramaEntity;
import br.com.obra360.domain.repository.EtapaCronogramaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CronogramaDomainService {

    private final EtapaCronogramaRepository etapaRepository;

    @Transactional
    public EtapaCronogramaEntity criarEtapa(EtapaCronogramaEntity etapa) {
        return etapaRepository.save(etapa);
    }

    @Transactional(readOnly = true)
    public List<EtapaCronogramaEntity> listarEtapasPorProjeto(Long projetoObraId) {
        return etapaRepository.findByProjetoObraIdOrderByOrdemExecucaoAsc(projetoObraId);
    }

    @Transactional
    public EtapaCronogramaEntity atualizarProgressoEtapa(Long etapaId, BigDecimal novoPercentual) {
        EtapaCronogramaEntity etapa = etapaRepository.findById(etapaId)
                .orElseThrow(() -> new IllegalArgumentException("Etapa de cronograma não encontrada ID: " + etapaId));
        etapa.setPercentualExecutado(novoPercentual);
        return etapaRepository.save(etapa);
    }

    @Transactional(readOnly = true)
    public BigDecimal calcularProgressoGeralProjeto(Long projetoObraId) {
        List<EtapaCronogramaEntity> etapas = etapaRepository.findByProjetoObraIdOrderByOrdemExecucaoAsc(projetoObraId);
        if (etapas.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal soma = etapas.stream()
                .map(EtapaCronogramaEntity::getPercentualExecutado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return soma.divide(BigDecimal.valueOf(etapas.size()), 2, RoundingMode.HALF_UP);
    }
}
