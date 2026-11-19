package br.com.obra360.infrastructure.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j @Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name="obra360.messaging.enabled",havingValue="true")
public class MensageriaOutboxScheduler {
    private final MensageriaOutboxPublisher publisher;
    public MensageriaOutboxScheduler(MensageriaOutboxPublisher publisher){this.publisher=publisher;}
    @Scheduled(fixedDelayString="${obra360.messaging.poll-ms:3000}",initialDelayString="${obra360.messaging.initial-delay-ms:3000}")
    public void publicarPendentes() {
        for(String id:publisher.pendentes()) {
            try {publisher.publicar(id);}
            catch(RuntimeException error){log.warn("Falha ao publicar evento pendente {}. Nova tentativa no próximo ciclo.",id);}
        }
    }
}
