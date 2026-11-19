package br.com.obra360.infrastructure.messaging;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.util.backoff.FixedBackOff;

@Configuration @EnableScheduling
@org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication(type=org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name="obra360.messaging.enabled",havingValue="true")
public class MensageriaKafkaConfig {
    public static final String TOPIC="obra360-ordens-notificacoes-v1";
    @Bean NewTopic ordensNotificacoesTopic() {return TopicBuilder.name(TOPIC).partitions(1).replicas(1).build();}
    @Bean DefaultErrorHandler mensageriaErrorHandler(
            br.com.obra360.application.service.MensageriaFalhasService failures,
            @org.springframework.beans.factory.annotation.Value("${obra360.messaging.retry-delay-ms:2000}") long delay,
            @org.springframework.beans.factory.annotation.Value("${obra360.messaging.retry-attempts:3}") long attempts) {
        if(delay<10||delay>60000||attempts<0||attempts>10)throw new IllegalArgumentException("Configuração de tentativas Kafka inválida.");
        // The recoverer must commit its DB transaction before the offset can advance.
        // If quarantine persistence fails, the exception is propagated and recovery is retried.
        var handler=new DefaultErrorHandler(failures::registrar,new FixedBackOff(delay,attempts));
        handler.setAckAfterHandle(true);
        handler.setResetStateOnRecoveryFailure(true);
        return handler;
    }
    @Bean("ordensKafkaListenerFactory")
    org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory<String,String> ordensKafkaListenerFactory(
            org.springframework.kafka.core.ConsumerFactory<?,?> base,DefaultErrorHandler mensageriaErrorHandler) {
        var props=new java.util.HashMap<String,Object>(base.getConfigurationProperties());
        props.put("key.deserializer",org.apache.kafka.common.serialization.StringDeserializer.class);
        props.put("value.deserializer",org.apache.kafka.common.serialization.StringDeserializer.class);
        props.put("enable.auto.commit",false);props.put("auto.offset.reset","earliest");
        var factory=new org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory<String,String>();
        factory.setConsumerFactory(new org.springframework.kafka.core.DefaultKafkaConsumerFactory<>(props));
        factory.getContainerProperties().setAckMode(org.springframework.kafka.listener.ContainerProperties.AckMode.RECORD);
        factory.setCommonErrorHandler(mensageriaErrorHandler);return factory;
    }
}
