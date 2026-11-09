package br.com.obra360.application.service;

import br.com.obra360.domain.entity.ModeloReferenciaEntity;
import jakarta.persistence.EntityManager;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.NoSuchFileException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Objects;

@Service @RequiredArgsConstructor
public class ModeloReferenciaService {
    private final EntityManager em;
    private final DocumentStorage storage;

    public ModeloReferenciaEntity find(Long id, Long tenant) {
        if (id == null) return null;
        var result = em.find(ModeloReferenciaEntity.class, id);
        if (result == null || !Objects.equals(result.getEmpresaId(), tenant))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return result;
    }

    public ModeloReferenciaEntity save(Long tenant, ModeloReferenciaEntity current, Metadata metadata,
            MultipartFile file, ModeloDocumento document) throws IOException {
        if (document.pavimentos().stream().noneMatch(floor -> floor.id().equals(metadata.pavimentoId())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pavimento da referência inexistente.");
        if (file.isEmpty() || file.getSize() > 20L * 1024 * 1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A referência deve ter até 20 MB.");
        String name = Objects.toString(file.getOriginalFilename(), "").replaceAll("[\\p{Cntrl}\\\\/]", "_").trim();
        byte[] bytes = file.getBytes();
        if (name.length() > 255 || !validFormat(name, bytes, metadata.pagina()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie um PDF, PNG, JPEG ou WebP válido.");
        String hash = hash(bytes);
        String key;
        if (current != null && current.getSha256().equals(hash)) {
            key = current.getArquivoKey();
        } else {
            key = storage.put(bytes);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_ROLLED_BACK) return;
                    try { storage.delete(key); }
                    catch (IOException | RuntimeException failure) {
                        LoggerFactory.getLogger(ModeloReferenciaService.class)
                            .warn("Falha ao remover referência após rollback", failure);
                    }
                }
            });
        }
        var result = new ModeloReferenciaEntity();
        result.setEmpresaId(tenant);
        result.setArquivoKey(key);
        result.setNomeArquivo(name);
        result.setSha256(hash);
        result.setPavimentoId(metadata.pavimentoId());
        result.setPagina(metadata.pagina());
        result.setX(metadata.x());
        result.setZ(metadata.z());
        result.setLargura(metadata.largura());
        result.setAltura(metadata.altura());
        result.setCalibrada(metadata.calibrada());
        em.persist(result);
        return result;
    }

    public byte[] read(ModeloReferenciaEntity reference) throws IOException {
        if (reference == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        byte[] bytes;
        try { bytes = storage.read(reference.getArquivoKey()); }
        catch (NoSuchFileException | software.amazon.awssdk.services.s3.model.NoSuchKeyException failure) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo de referência indisponível.");
        }
        if (!reference.getSha256().equals(hash(bytes)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Integridade do arquivo de referência divergente.");
        return bytes;
    }

    private static boolean validFormat(String name, byte[] bytes, int page) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return prefix(bytes, 0, "%PDF-");
        if (page != 1) return false;
        if (lower.endsWith(".png")) return prefix(bytes, 0, "\u0089PNG\r\n\u001a\n");
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return prefix(bytes, 0, "\u00ff\u00d8\u00ff");
        return lower.endsWith(".webp") && prefix(bytes, 0, "RIFF") && prefix(bytes, 8, "WEBP");
    }

    private static boolean prefix(byte[] bytes, int offset, String signature) {
        byte[] expected = signature.getBytes(StandardCharsets.ISO_8859_1);
        if (bytes.length < offset + expected.length) return false;
        for (int index = 0; index < expected.length; index++) {
            if (bytes[offset + index] != expected[index]) return false;
        }
        return true;
    }

    private static String hash(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (NoSuchAlgorithmException failure) { throw new IllegalStateException(failure); }
    }

    public record Metadata(@NotBlank @Size(max = 64) String pavimentoId, @Min(1) @Max(10000) int pagina,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double x,
        @NotNull @DecimalMin("-10000") @DecimalMax("10000") Double z,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("2000") Double largura,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("2000") Double altura,
        boolean calibrada) {}
}
