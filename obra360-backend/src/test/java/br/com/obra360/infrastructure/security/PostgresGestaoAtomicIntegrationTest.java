package br.com.obra360.infrastructure.security;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
@EnabledIfEnvironmentVariable(named="TEST_POSTGRES_URL",matches=".+")
@SpringBootTest(properties={
 "obra360.security.requests-per-minute=10000","DOCUMENT_STORAGE=local","AI_ENABLED=false","EMAIL_ENABLED=false","GOOGLE_CLIENT_ID=","SEFAZ_ENABLED=false",
 "spring.datasource.url=${TEST_POSTGRES_URL}","spring.datasource.username=${TEST_POSTGRES_USERNAME}","spring.datasource.password=${TEST_POSTGRES_PASSWORD}",
 "spring.datasource.driver-class-name=org.postgresql.Driver","spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
 "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect","spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate",
 "spring.flyway.schemas=gestao_atomic","spring.flyway.default-schema=gestao_atomic","spring.jpa.properties.hibernate.default_schema=gestao_atomic",
 "obra360.storage.directory=${java.io.tmpdir}/obra360-pg-gestao-${random.uuid}"
})
class PostgresGestaoAtomicIntegrationTest extends GestaoAtomicIntegrationTest {}
