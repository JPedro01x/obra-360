package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.ChatCorporativoService;
import br.com.obra360.domain.entity.MensagemChatEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatCorporativoController {

    private final ChatCorporativoService chatService;

    @PostMapping("/mensagens")
    public ResponseEntity<MensagemChatEntity> enviarMensagem(@Valid @RequestBody MensagemChatEntity mensagem) {
        MensagemChatEntity salva = chatService.enviarMensagem(mensagem);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/mensagens/conversas")
    public ResponseEntity<List<MensagemChatEntity>> obterHistorico(@RequestParam Long remetenteId, @RequestParam Long destinatarioId) {
        List<MensagemChatEntity> mensagens = chatService.obterHistoricoMensagens(remetenteId, destinatarioId);
        return ResponseEntity.ok(mensagens);
    }
}
