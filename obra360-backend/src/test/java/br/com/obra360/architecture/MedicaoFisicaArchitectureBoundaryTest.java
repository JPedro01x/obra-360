package br.com.obra360.architecture;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

/** Scope-limited rule: this pilot slice is clean; legacy packages remain tracked migration debt. */
class MedicaoFisicaArchitectureBoundaryTest {
    private static final Path SOURCE = Path.of("src/main/java/br/com/obra360/application");

    @Test void applicationSliceDoesNotDependOnAdaptersOrFrameworks() throws Exception {
        for (String area : new String[]{"model", "port/out", "usecase"}) {
            Path root = SOURCE.resolve(area);
            try (var files = Files.walk(root)) {
                for (Path file : files.filter(path -> path.toString().endsWith(".java")).toList()) {
                    String source = Files.readString(file);
                    assertFalse(source.contains("br.com.obra360.infrastructure"), file + " imports infrastructure");
                    assertFalse(source.contains("br.com.obra360.domain.entity"), file + " imports persistence entities");
                    assertFalse(source.contains("jakarta.persistence"), file + " imports JPA");
                    assertFalse(source.contains("org.springframework"), file + " imports Spring");
                }
            }
        }
        assertTrue(Files.exists(SOURCE.resolve("usecase/ListMedicoesFisicas.java")));
    }
}
