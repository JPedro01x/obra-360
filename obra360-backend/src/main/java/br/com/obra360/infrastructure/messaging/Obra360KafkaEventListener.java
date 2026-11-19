package br.com.obra360.infrastructure.messaging;

import br.com.obra360.application.service.MensageriaOrdensService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name="obra360.messaging.enabled",havingValue="true")
public class Obra360KafkaEventListener {
    private final MensageriaOrdensService service;
    public Obra360KafkaEventListener(MensageriaOrdensService service){this.service=service;}
    @KafkaListener(id="ordens-notificacoes",topics=MensageriaKafkaConfig.TOPIC,
        groupId="obra360-notificacoes-v1",containerFactory="ordensKafkaListenerFactory",autoStartup="true")
    public void processarOrdem(String eventoId){service.processar(eventoId);}
}
