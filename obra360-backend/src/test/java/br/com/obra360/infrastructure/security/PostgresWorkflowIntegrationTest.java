package br.com.obra360.infrastructure.security;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/** Runs the same workflow/security suite on a dedicated real PostgreSQL DB. */
@EnabledIfEnvironmentVariable(named="TEST_POSTGRES_URL",matches=".+")
@SpringBootTest(properties={
    "obra360.security.requests-per-minute=10000","DOCUMENT_STORAGE=local","AI_ENABLED=false","EMAIL_ENABLED=false","GOOGLE_CLIENT_ID=","SEFAZ_ENABLED=false",
    "spring.datasource.url=${TEST_POSTGRES_URL}","spring.datasource.username=${TEST_POSTGRES_USERNAME}",
    "spring.datasource.password=${TEST_POSTGRES_PASSWORD}","spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate",
    "MFA_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "obra360.storage.directory=${java.io.tmpdir}/obra360-pg-test-documents-${random.uuid}"
})
class PostgresWorkflowIntegrationTest extends WorkspaceSecurityIntegrationTest {}
