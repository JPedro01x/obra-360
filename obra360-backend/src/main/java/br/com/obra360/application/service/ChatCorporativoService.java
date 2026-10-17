package br.com.obra360.application.service;

import br.com.obra360.domain.entity.MensagemChatEntity;
import br.com.obra360.domain.repository.MensagemChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatCorporativoService {

    private final MensagemChatRepository chatRepository;

    @Transactional
    public MensagemChatEntity enviarMensagem(MensagemChatEntity mensagem) {
        return chatRepository.save(mensagem);
    }

    @Transactional(readOnly = true)
    public List<MensagemChatEntity> obterHistoricoMensagens(Long usuario1, Long usuario2) {
        return chatRepository.findByRemetenteIdAndDestinatarioId(usuario1, usuario2);
    }
}
