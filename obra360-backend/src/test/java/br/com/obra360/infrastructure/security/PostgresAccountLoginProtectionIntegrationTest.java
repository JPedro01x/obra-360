package br.com.obra360.infrastructure.security;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/** Repeat the committed, concurrent login scenarios with real PostgreSQL row locks. */
@EnabledIfEnvironmentVariable(named="TEST_POSTGRES_URL", matches=".+")
@SpringBootTest(properties={
    "obra360.security.requests-per-minute=10000", "AI_ENABLED=false", "EMAIL_ENABLED=false",
    "GOOGLE_CLIENT_ID=", "SEFAZ_ENABLED=false", "obra360.messaging.enabled=false",
    "spring.datasource.url=${TEST_POSTGRES_URL}", "spring.datasource.username=${TEST_POSTGRES_USERNAME}",
    "spring.datasource.password=${TEST_POSTGRES_PASSWORD}", "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.schemas=auth_login_protection", "spring.flyway.default-schema=auth_login_protection",
    "spring.jpa.properties.hibernate.default_schema=auth_login_protection",
    "obra360.storage.directory=${java.io.tmpdir}/obra360-pg-auth-${random.uuid}"
})
class PostgresAccountLoginProtectionIntegrationTest extends AccountLoginProtectionIntegrationTest {}
