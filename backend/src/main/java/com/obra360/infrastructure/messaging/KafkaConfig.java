package com.obra360.infrastructure.messaging;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * CLEAN ARCHITECTURE - INFRASTRUCTURE LAYER
 * Configuração do Apache Kafka para criação automática de tópicos de eventos DDD
 */
@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic stockMinTopic() {
        return TopicBuilder.name("obra360.events.stock-min")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
