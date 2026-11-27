package br.com.obra360.application.service;

import br.com.obra360.infrastructure.security.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** Durable deduplication for external requests, without storing the prompt or fiscal key. */
@Service
@Slf4j
public class IntegrationIdempotencyService {
    private static final Set<String> OPERATIONS = Set.of("IA", "SEFAZ");
    private static final int RETENTION_DAYS = 30;
    private static final Pattern UUID_KEY = Pattern.compile("(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;
    private final byte[] fingerprintSecret;

    public IntegrationIdempotencyService(JdbcTemplate jdbc, PlatformTransactionManager manager,
                                         @Value("${obra360.jwt.secret}") String jwtSecret) {
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(manager);
        this.transactions.setTimeout(5);
        this.fingerprintSecret = jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    public void claim(String operation, String suppliedKey, String requestPayload, Long actor) {
        if (!OPERATIONS.contains(operation)) throw new IllegalArgumentException("Unsupported integration operation.");
        final String normalizedKey;
        try {
            if (suppliedKey == null || !UUID_KEY.matcher(suppliedKey).matches()) throw new IllegalArgumentException();
            normalizedKey = UUID.fromString(suppliedKey).toString();
        }
        catch (RuntimeException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma chave de idempotência UUID válida."); }
        Long tenant = TenantContext.getCurrentTenant();
        if (tenant == null || actor == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String keyHash = sha256(normalizedKey);
        String requestHash = fingerprint(operation + "\u0000" + requestPayload);
        ClaimResult result;
        try {
            result = transactions.execute(status -> {
                jdbc.update("delete from integracao_idempotencia where empresa_id=? and usuario_id=? and operacao=? and criado_em<?",
                    tenant, actor, operation, OffsetDateTime.now().minusDays(RETENTION_DAYS));
                List<String> existing = jdbc.query("select solicitacao_hash from integracao_idempotencia where empresa_id=? and usuario_id=? and operacao=? and chave_hash=?",
                    (rs, row) -> rs.getString(1), tenant, actor, operation, keyHash);
                if (!existing.isEmpty()) return new ClaimResult(existing.getFirst(), false);
                jdbc.update("insert into integracao_idempotencia(empresa_id,usuario_id,operacao,chave_hash,solicitacao_hash,situacao,criado_em) values(?,?,?,?,?,'PROCESSANDO',?)",
                    tenant, actor, operation, keyHash, requestHash, OffsetDateTime.now());
                return new ClaimResult(requestHash, true);
            });
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta solicitação já foi registrada. Use uma nova chave apenas para iniciar outra consulta.");
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Controle de repetição das integrações indisponível; a consulta não foi enviada.");
        }
        if (result == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Controle de repetição das integrações indisponível.");
        if (!result.created()) {
            if (!MessageDigest.isEqual(result.requestHash().getBytes(StandardCharsets.US_ASCII), requestHash.getBytes(StandardCharsets.US_ASCII)))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta chave de idempotência já foi usada com outros dados.");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta solicitação já foi registrada. Use uma nova chave apenas para iniciar outra consulta.");
        }
    }

    public void finish(String operation, String suppliedKey, Long actor, String status) {
        if (!OPERATIONS.contains(operation) || !Set.of("CONCLUIDA", "FALHA").contains(status))
            throw new IllegalArgumentException("Unsupported idempotency state.");
        String keyHash;
        try {
            if (suppliedKey == null || !UUID_KEY.matcher(suppliedKey).matches()) throw new IllegalArgumentException();
            keyHash = sha256(UUID.fromString(suppliedKey).toString());
        }
        catch (RuntimeException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chave de idempotência inválida."); }
        Long tenant = TenantContext.getCurrentTenant();
        try {
            transactions.executeWithoutResult(tx -> {
                int updated = jdbc.update("update integracao_idempotencia set situacao=?,finalizado_em=CURRENT_TIMESTAMP where empresa_id=? and usuario_id=? and operacao=? and chave_hash=? and situacao='PROCESSANDO'",
                    status, tenant, actor, operation, keyHash);
                if (updated == 0) {
                    List<String> states = jdbc.query("select situacao from integracao_idempotencia where empresa_id=? and usuario_id=? and operacao=? and chave_hash=?",
                        (rs, row) -> rs.getString(1), tenant, actor, operation, keyHash);
                    if (states.isEmpty() || !status.equals(states.getFirst()))
                        throw new IllegalStateException("Idempotency claim could not be finalized.");
                }
            });
        } catch (RuntimeException ex) {
            log.warn("Integration idempotency state could not be finalized; duplicate submissions remain blocked.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Não foi possível confirmar o estado da consulta externa.");
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3600000)
    public void cleanupExpired() {
        try {
            transactions.executeWithoutResult(tx -> jdbc.update("delete from integracao_idempotencia where criado_em<?",
                OffsetDateTime.now().minusDays(RETENTION_DAYS)));
        } catch (RuntimeException ex) {
            log.warn("Expired integration idempotency keys could not be cleaned; request admission remains fail closed.");
        }
    }

    private String sha256(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception ex) { throw new IllegalStateException("SHA-256 indisponível."); }
    }

    private String fingerprint(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(fingerprintSecret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) { throw new IllegalStateException("Fingerprint seguro indisponível."); }
    }

    private record ClaimResult(String requestHash, boolean created) {}
}
