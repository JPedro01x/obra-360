package br.com.obra360.infrastructure;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.SharedEntityManagerCreator;

/** Transaction-bound proxy for services using JPA directly, without repository interfaces. */
@Configuration(proxyBeanMethods = false)
public class PersistenceConfig {
    @Bean
    EntityManager transactionalEntityManager(EntityManagerFactory factory) {
        return SharedEntityManagerCreator.createSharedEntityManager(factory);
    }
}
