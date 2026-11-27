package br.com.obra360.application.service;

import br.com.obra360.domain.entity.MensagemChatEntity;
import br.com.obra360.domain.repository.MensagemChatRepository;
import br.com.obra360.domain.repository.UsuarioRepository;
import br.com.obra360.domain.entity.UsuarioEntity;
import br.com.obra360.infrastructure.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class ChatCorporativoService {

    private final MensagemChatRepository chatRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public MensagemChatEntity enviar(Long remetenteId, Long destinatarioId, String conteudo) {
        Long empresaId = tenant();
        UsuarioEntity remetente = usuario(remetenteId, empresaId);
        UsuarioEntity destinatario = usuario(destinatarioId, empresaId);
        if (remetenteId.equals(destinatarioId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha outra pessoa para a conversa.");
        MensagemChatEntity mensagem = MensagemChatEntity.builder()
            .empresaId(empresaId)
            .remetenteId(remetente.getId())
            .destinatarioId(destinatario.getId())
            .conteudoMensagem(conteudo.trim())
            .lida(false)
            .build();
        return chatRepository.save(mensagem);
    }

    @Transactional(readOnly = true)
    public List<MensagemChatEntity> conversa(Long atual, Long outro) {
        Long empresaId = tenant();
        usuario(atual, empresaId);
        usuario(outro, empresaId);
        List<MensagemChatEntity> messages = chatRepository.conversation(empresaId, atual, outro, PageRequest.of(0, 100));
        Collections.reverse(messages);
        return messages;
    }

    @Transactional
    public int marcarLidas(Long destinatarioAtual, Long remetente) {
        Long empresaId = tenant();
        usuario(destinatarioAtual, empresaId);
        usuario(remetente, empresaId);
        return chatRepository.markRead(empresaId, remetente, destinatarioAtual);
    }

    @Transactional(readOnly = true)
    public List<UsuarioEntity> contatos(Long atual) {
        Long empresaId = tenant();
        usuario(atual, empresaId);
        return usuarioRepository.findByEmpresaIdAndAtivoTrueOrderByNome(empresaId).stream()
            .filter(user -> !user.getId().equals(atual) && !java.util.Set.of("CLIENTE", "FORNECEDOR", "LOCADOR_MAQUINAS", "CORRETOR", "INVESTIDOR").contains(user.getPerfil()))
            .toList();
    }

    private UsuarioEntity usuario(Long id, Long empresaId) {
        UsuarioEntity user = usuarioRepository.findByIdAndEmpresaId(id, empresaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!Boolean.TRUE.equals(user.getAtivo())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return user;
    }

    private Long tenant() {
        Long tenant = TenantContext.getCurrentTenant();
        if (tenant == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return tenant;
    }
}
