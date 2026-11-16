package br.com.obra360.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import static org.junit.jupiter.api.Assertions.*;

/** Real embedded server: MockMvc alone cannot catch missing runtime persistence beans. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.profiles.active=dev",
    "spring.datasource.url=jdbc:h2:mem:runtime_startup;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true", "spring.kafka.listener.auto-startup=false",
    "obra360.jwt.secret=runtime-startup-synthetic-key-of-at-least-32-bytes"
})
class RuntimeStartupIntegrationTest {
    @Value("${local.server.port}") int port;
    @Test void realServerStartsWithDatabaseAndProtectsBusinessEndpoints() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            var health = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/actuator/health/readiness")).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, health.statusCode());
            assertTrue(health.body().contains("\"UP\""));
            var privateData = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1/workspace/resumo")).GET().build(), HttpResponse.BodyHandlers.discarding());
            assertEquals(401, privateData.statusCode());
        }
    }
}
