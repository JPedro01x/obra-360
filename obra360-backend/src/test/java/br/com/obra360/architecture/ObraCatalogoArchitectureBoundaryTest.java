package br.com.obra360.architecture;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import static org.junit.jupiter.api.Assertions.*;

/** This pilot boundary is enforced while WorkspaceController and domain.entity remain explicit legacy migration debt. */
class ObraCatalogoArchitectureBoundaryTest {
    private static final Path MAIN = Path.of("src/main/java/br/com/obra360");

    @Test void dependencyScannerIgnoresCommentsAndLiteralsButFindsImportsAndQualifiedNames() {
        String decoys = "// import org.springframework.fake.Adapter;\n" +
            "/* jakarta.persistence.EntityManager */ String note = \"br.com.obra360.infrastructure.fake\";";
        assertFalse(containsDependency(decoys, "org.springframework", "jakarta.persistence", "br.com.obra360.infrastructure"));
        String textBlock = "String note = \"\"\"\nimport br.com.obra360.infrastructure.fake.Adapter;\n\"\"\";";
        assertFalse(containsDependency(textBlock, "br.com.obra360.infrastructure"));
        String escapedDelimiter = "\\" + "\"\"\"";
        String textBlockWithEscapedDelimiter = "String note = \"\"\"\n" + escapedDelimiter +
            "\nimport br.com.obra360.infrastructure.persistence.MedicaoFisicaJpaReadAdapter;\n\"\"\";";
        assertFalse(containsDependency(textBlockWithEscapedDelimiter, "br.com.obra360.infrastructure.persistence"));
        assertFalse(containsDependency("char marker = 'x';", "x"));

        String actual = "import org.springframework.context.Bean;\n" +
            "class Sample { br.com.obra360 . infrastructure . persistence . Adapter adapter; }";
        assertTrue(containsDependency(actual, "org.springframework"));
        assertTrue(containsDependency(actual, "br.com.obra360.infrastructure"));
        assertTrue(containsDependency("import br.com.obra360.infrastructure.persistence.MedicaoFisicaJpaReadAdapter;",
            "br.com.obra360.infrastructure.persistence"));
        assertTrue(containsDependency("org.springframework . data . repository . JpaRepository<Thing, Long>",
            "org.springframework.data"));
    }

    @Test void cleanSliceHasOnlyInwardDependencies() throws Exception {
        assertNoImports(MAIN.resolve("domain/model"), "br.com.obra360.application", "br.com.obra360.infrastructure", "br.com.obra360.domain.entity", "jakarta.persistence", "org.springframework");
        assertNoImports(MAIN.resolve("application/usecase"), "br.com.obra360.infrastructure", "br.com.obra360.domain.entity", "jakarta.persistence", "org.springframework");
        assertNoImports(MAIN.resolve("application/port/out"), "br.com.obra360.infrastructure", "br.com.obra360.domain.entity", "jakarta.persistence", "org.springframework");
        assertNoImports(MAIN.resolve("application/model"), "br.com.obra360.infrastructure", "br.com.obra360.domain.entity", "jakarta.persistence", "org.springframework");
        assertNoImports(MAIN.resolve("infrastructure/persistence/adapter"), "br.com.obra360.application.usecase", "br.com.obra360.infrastructure.web");
        String controller = Files.readString(MAIN.resolve("infrastructure/web/controller/WorkspaceObrasController.java"));
        String controllerCode = codeOnly(controller);
        assertTrue(Pattern.compile("\\blistObras\\s*\\.\\s*execute\\s*\\(").matcher(controllerCode).find(),
            "WorkspaceObrasController must delegate to ListObrasPorEmpresa");
        assertFalse(containsDependency(controller, "br.com.obra360.domain.entity", "br.com.obra360.domain.repository",
            "br.com.obra360.infrastructure.persistence", "org.springframework.data", "jakarta.persistence"));
        assertFalse(Pattern.compile("\\bEntityManager\\b").matcher(controllerCode).find());
        assertTrue(Files.exists(MAIN.resolve("application/usecase/ListObrasPorEmpresa.java")));
    }

    private void assertNoImports(Path root, String... forbidden) throws Exception {
        try (var files = Files.walk(root)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file);
                for (String dependency : forbidden) assertFalse(containsDependency(source, dependency), file + " must not depend on " + dependency);
            }
        }
    }

    private static boolean containsDependency(String source, String... dependencies) {
        String code = codeOnly(source).replaceAll("\\s*\\.\\s*", ".");
        for (String dependency : dependencies) {
            Pattern boundary = Pattern.compile(Pattern.quote(dependency) + "(?![\\w$])");
            if (boundary.matcher(code).find()) return true;
        }
        return false;
    }

    /** Removes comments, string literals, text blocks, and character literals before source checks. */
    private static String codeOnly(String source) {
        StringBuilder code = new StringBuilder(source.length());
        int i = 0;
        while (i < source.length()) {
            char current = source.charAt(i);
            if (current == '/' && i + 1 < source.length() && source.charAt(i + 1) == '/') {
                i += 2;
                while (i < source.length() && source.charAt(i) != '\n' && source.charAt(i) != '\r') i++;
                code.append(' ');
            } else if (current == '/' && i + 1 < source.length() && source.charAt(i + 1) == '*') {
                i += 2;
                while (i + 1 < source.length() && !(source.charAt(i) == '*' && source.charAt(i + 1) == '/')) i++;
                i = Math.min(source.length(), i + 2);
                code.append(' ');
            } else if (current == '"' && source.startsWith("\"\"\"", i)) {
                i += 3;
                while (i + 2 < source.length() &&
                    !(source.startsWith("\"\"\"", i) && !isEscaped(source, i))) i++;
                i = Math.min(source.length(), i + 3);
                code.append(' ');
            } else if (current == '"' || current == '\'') {
                char delimiter = current;
                i++;
                while (i < source.length()) {
                    char literalChar = source.charAt(i++);
                    if (literalChar == '\\' && i < source.length()) i++;
                    else if (literalChar == delimiter) break;
                }
                code.append(' ');
            } else {
                code.append(current);
                i++;
            }
        }
        return code.toString();
    }

    private static boolean isEscaped(String source, int index) {
        int backslashes = 0;
        for (int i = index - 1; i >= 0 && source.charAt(i) == '\\'; i--) backslashes++;
        return backslashes % 2 != 0;
    }
}
