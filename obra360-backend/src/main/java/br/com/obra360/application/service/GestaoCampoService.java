package br.com.obra360.application.service;

import br.com.obra360.domain.entity.EquipeTrabalhoEntity;
import br.com.obra360.domain.entity.SolicitacaoServicoEntity;
import br.com.obra360.domain.repository.EquipeTrabalhoRepository;
import br.com.obra360.domain.repository.SolicitacaoServicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GestaoCampoService {

    private final EquipeTrabalhoRepository equipeRepository;
    private final SolicitacaoServicoRepository solicitacaoRepository;

    @Transactional
    public EquipeTrabalhoEntity cadastrarEquipe(EquipeTrabalhoEntity equipe) {
        return equipeRepository.save(equipe);
    }

    @Transactional(readOnly = true)
    public List<EquipeTrabalhoEntity> listarEquipesPorProjeto(Long projetoObraId) {
        return equipeRepository.findByProjetoObraId(projetoObraId);
    }

    @Transactional
    public SolicitacaoServicoEntity criarOrdemServico(SolicitacaoServicoEntity solicitacao) {
        if (solicitacao.getCodigoProtocolo() == null || solicitacao.getCodigoProtocolo().isBlank()) {
            solicitacao.setCodigoProtocolo("OS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (solicitacao.getDataLimiteSla() == null) {
            solicitacao.setDataLimiteSla(OffsetDateTime.now().plusHours(48)); // SLA Padrão 48h
        }
        return solicitacaoRepository.save(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoServicoEntity> listarOrdensPorContrato(Long contratoServicoId) {
        return solicitacaoRepository.findByContratoServicoId(contratoServicoId);
    }

    @Transactional
    public SolicitacaoServicoEntity encerrarOrdemServico(Long solicitacaoId) {
        SolicitacaoServicoEntity os = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new IllegalArgumentException("Ordem de Serviço não encontrada ID: " + solicitacaoId));
        os.setStatusOs("CONCLUIDO");
        os.setDataEncerramento(OffsetDateTime.now());
        return solicitacaoRepository.save(os);
    }
}
