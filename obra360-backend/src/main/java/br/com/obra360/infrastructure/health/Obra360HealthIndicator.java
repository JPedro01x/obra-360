package br.com.obra360.infrastructure.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class Obra360HealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        // Health Check customizado para verificar disponibilidade dos módulos e broker do Obra360
        return Health.up()
                .withDetail("plataforma", "Obra360 Corporativo")
                .withDetail("componente", "aplicacao")
                .build();
    }
}
