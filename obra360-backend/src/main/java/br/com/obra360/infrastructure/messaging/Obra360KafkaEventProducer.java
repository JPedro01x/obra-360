package br.com.obra360.infrastructure.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="obra360.messaging.enabled",havingValue="true")
public class Obra360KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final org.springframework.kafka.core.DefaultKafkaProducerFactory<String,String> producerFactory;
    public Obra360KafkaEventProducer(org.springframework.kafka.core.ProducerFactory<Object,Object> base) {
        var properties=new java.util.HashMap<String,Object>(base.getConfigurationProperties());
        properties.putAll(java.util.Map.of(
            "key.serializer",org.apache.kafka.common.serialization.StringSerializer.class,
            "value.serializer",org.apache.kafka.common.serialization.StringSerializer.class,
            "acks","all","enable.idempotence",true,"max.block.ms",3000,
            "request.timeout.ms",3000,"delivery.timeout.ms",5000));
        producerFactory=new org.springframework.kafka.core.DefaultKafkaProducerFactory<>(properties);
        kafkaTemplate=new KafkaTemplate<>(producerFactory);
    }
    @jakarta.annotation.PreDestroy public void close(){kafkaTemplate.destroy();producerFactory.destroy();}

    public void publicarEvento(String topico, String chave, String mensagem) {
        log.info("Publicando evento Kafka no tópico {}: chave={}", topico, chave);
        try {
            kafkaTemplate.send(topico, chave, mensagem).get(5,java.util.concurrent.TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Publicação Kafka interrompida.",e);
        } catch (Exception e) {
            throw new IllegalStateException("Publicação Kafka não confirmada.",e);
        }
    }
}
