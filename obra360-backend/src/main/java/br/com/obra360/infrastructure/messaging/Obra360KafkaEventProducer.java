package br.com.obra360.infrastructure.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class Obra360KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publicarEvento(String topico, String chave, String mensagem) {
        log.info("Publicando evento Kafka no tópico {}: chave={}", topico, chave);
        try {
            kafkaTemplate.send(topico, chave, mensagem);
        } catch (Exception e) {
            log.warn("Mensageria Kafka em modo simulação fallback: {}", e.getMessage());
        }
    }
}
