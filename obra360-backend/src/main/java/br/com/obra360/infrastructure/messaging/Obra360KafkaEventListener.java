package br.com.obra360.infrastructure.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class Obra360KafkaEventListener {

    @KafkaListener(topics = "obra360-eventos-estoque", groupId = "obra360-group", autoStartup = "false")
    public void processarEventoEstoque(String mensagem) {
        log.info("Evento de Estoque recebido via Kafka: {}", mensagem);
    }

    @KafkaListener(topics = "obra360-eventos-ocorrencia", groupId = "obra360-group", autoStartup = "false")
    public void processarEventoOcorrencia(String mensagem) {
        log.info("Evento de Ocorrência/Qualidade recebido via Kafka: {}", mensagem);
    }
}
