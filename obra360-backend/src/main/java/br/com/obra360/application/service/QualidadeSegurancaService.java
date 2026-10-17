package br.com.obra360.application.service;

import br.com.obra360.domain.entity.OcorrenciaQualidadeEntity;
import br.com.obra360.domain.repository.OcorrenciaQualidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QualidadeSegurancaService {

    private final OcorrenciaQualidadeRepository ocorrenciaRepository;

    @Transactional
    public OcorrenciaQualidadeEntity registrarOcorrencia(OcorrenciaQualidadeEntity ocorrencia) {
        return ocorrenciaRepository.save(ocorrencia);
    }

    @Transactional(readOnly = true)
    public List<OcorrenciaQualidadeEntity> listarPorProjeto(Long projetoObraId) {
        return ocorrenciaRepository.findByProjetoObraId(projetoObraId);
    }

    @Transactional
    public OcorrenciaQualidadeEntity atualizarStatusPlanoAcao(Long ocorrenciaId, String novoStatus) {
        OcorrenciaQualidadeEntity ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
                .orElseThrow(() -> new IllegalArgumentException("Ocorrência de qualidade não encontrada ID: " + ocorrenciaId));
        ocorrencia.setStatusPlanoAcao(novoStatus);
        return ocorrenciaRepository.save(ocorrencia);
    }
}
