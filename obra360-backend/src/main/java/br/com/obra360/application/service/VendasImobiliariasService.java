package br.com.obra360.application.service;

import br.com.obra360.domain.entity.GarantiaPosVendaEntity;
import br.com.obra360.domain.entity.UnidadeImobiliariaEntity;
import br.com.obra360.domain.repository.GarantiaPosVendaRepository;
import br.com.obra360.domain.repository.UnidadeImobiliariaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VendasImobiliariasService {

    private final UnidadeImobiliariaRepository unidadeRepository;
    private final GarantiaPosVendaRepository garantiaRepository;

    @Transactional
    public UnidadeImobiliariaEntity cadastrarUnidade(UnidadeImobiliariaEntity unidade) {
        return unidadeRepository.save(unidade);
    }

    @Transactional(readOnly = true)
    public List<UnidadeImobiliariaEntity> listarUnidadesPorProjeto(Long projetoObraId) {
        return unidadeRepository.findByProjetoObraId(projetoObraId);
    }

    @Transactional
    public GarantiaPosVendaEntity abrirChamadoGarantia(GarantiaPosVendaEntity chamado) {
        if (chamado.getCodigoChamado() == null || chamado.getCodigoChamado().isBlank()) {
            chamado.setCodigoChamado("GAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return garantiaRepository.save(chamado);
    }

    @Transactional(readOnly = true)
    public List<GarantiaPosVendaEntity> listarGarantiasPorUnidade(Long unidadeId) {
        return garantiaRepository.findByUnidadeImobiliariaId(unidadeId);
    }
}
