package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.ChatCorporativoService;
import br.com.obra360.domain.entity.MensagemChatEntity;
import br.com.obra360.domain.entity.UsuarioEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workspace/chat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','MESTRE_OBRA','RH','ALMOXARIFE','FINANCEIRO','AUDITOR','INCORPORADOR','COLABORADOR')")
public class ChatCorporativoController {
    private final ChatCorporativoService service;

    @GetMapping("/contatos")
    public List<Contact> contacts(Authentication auth) {
        long current = currentUser(auth);
        return service.contatos(current).stream().map(ChatCorporativoController::contact).toList();
    }

    @GetMapping("/mensagens")
    public List<Message> conversation(@RequestParam @Positive Long usuarioId, Authentication auth) {
        return service.conversa(currentUser(auth), usuarioId).stream().map(ChatCorporativoController::message).toList();
    }

    @PostMapping("/mensagens")
    @ResponseStatus(HttpStatus.CREATED)
    public Message send(@Valid @RequestBody SendMessage request, Authentication auth) {
        return message(service.enviar(currentUser(auth), request.destinatarioId(), request.conteudo()));
    }

    @PatchMapping("/conversas/{usuarioId}/lidas")
    public ReadResult read(@PathVariable @Positive Long usuarioId, Authentication auth) {
        return new ReadResult(service.marcarLidas(currentUser(auth), usuarioId));
    }

    private static long currentUser(Authentication auth) {
        try { return Long.parseLong(auth.getName()); }
        catch (RuntimeException invalid) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED); }
    }

    private static Contact contact(UsuarioEntity user) {
        return new Contact(user.getId(), user.getNome(), user.getPerfil());
    }

    private static Message message(MensagemChatEntity m) {
        return new Message(m.getId(), m.getRemetenteId(), m.getDestinatarioId(), m.getConteudoMensagem(),
            Boolean.TRUE.equals(m.getLida()), m.getDataEnvio());
    }

    public record SendMessage(@NotNull @Positive Long destinatarioId, @NotBlank @Size(max=4000) String conteudo) {}
    public record Contact(Long id, String nome, String perfil) {}
    public record Message(Long id, Long remetenteId, Long destinatarioId, String conteudo,
        boolean lida, OffsetDateTime enviadaEm) {}
    public record ReadResult(int mensagensAtualizadas) {}
}
