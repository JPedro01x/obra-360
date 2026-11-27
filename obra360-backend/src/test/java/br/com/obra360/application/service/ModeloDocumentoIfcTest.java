package br.com.obra360.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ModeloDocumentoIfcTest {
    private static jakarta.validation.Validator validator;
    private static jakarta.validation.ValidatorFactory factory;
    private static ModeloDocumentoService service;

    @BeforeAll static void setup() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        service = new ModeloDocumentoService(new ObjectMapper(), validator);
    }

    @AfterAll static void close() { factory.close(); }

    @Test void acceptsAndRoundTripsRealIfcMeshInSchemaThree() {
        var document = document(3, mesh(trianglePositions(), triangleIndices()));
        String encoded = service.encode(document);
        var decoded = service.decode(encoded);
        assertEquals("0J$5eUQxP8w8mO7sQyG7xA", decoded.elementos().get(0).malhaIfc().sourceGlobalId());
        assertEquals(3, decoded.schemaVersao());
        assertArrayEquals(triangleIndices(), Base64.getDecoder().decode(decoded.elementos().get(0).malhaIfc().indicesBase64()));
    }

    @Test void rejectsIfcMeshInLegacySchema() {
        var document = document(2, mesh(trianglePositions(), triangleIndices()));
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.encode(document));
    }

    @Test void rejectsIfcIndexOutsideVertexArray() {
        byte[] invalid = indices(0, 1, 3);
        var document = document(3, mesh(trianglePositions(), invalid));
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.encode(document));
    }

    @Test void schemaThreeKeepsConnectedWallTopologyFromSchemaTwo() {
        var meshElement = document(3, mesh(trianglePositions(), triangleIndices())).elementos().get(0);
        var wall = new ModeloDocumento.Elemento("wall-1", "floor-1", "PAREDE", "Parede conectada",
            2d, 0d, 0d, 4d, 0.2d, 2.8d, 0d, "#aabbcc", null, 0d, "node-a", "node-b", null);
        var doc = new ModeloDocumento(3,
            List.of(new ModeloDocumento.Pavimento("floor-1", "Térreo", 0d, 3d)),
            List.of(wall, meshElement),
            List.of(new ModeloDocumento.No("node-a", "floor-1", 0d, 0d),
                new ModeloDocumento.No("node-b", "floor-1", 4d, 0d)),
            List.of(), List.of());

        assertTrue(service.encode(doc).contains("\"schemaVersao\":3"));
    }

    private static ModeloDocumento document(int schema, ModeloDocumento.MalhaIfc mesh) {
        var floor = new ModeloDocumento.Pavimento("floor-1", "Térreo", 0d, 3d);
        var element = new ModeloDocumento.Elemento("ifc-1", "floor-1", "MALHA_IFC", "IfcWall",
            0d, 0d, 0d, 1d, 1d, 1d, 0d, "#aabbcc", null, 0d, null, null, mesh);
        return new ModeloDocumento(schema, List.of(floor), List.of(element), List.of(), List.of(), List.of());
    }

    private static ModeloDocumento.MalhaIfc mesh(byte[] positions, byte[] indices) {
        return new ModeloDocumento.MalhaIfc(Base64.getEncoder().encodeToString(positions),
            Base64.getEncoder().encodeToString(indices),
            List.of(new ModeloDocumento.PontoPlanta(0d, 0d), new ModeloDocumento.PontoPlanta(1d, 0d), new ModeloDocumento.PontoPlanta(0d, 1d)),
            "0J$5eUQxP8w8mO7sQyG7xA", 42, "IFCWALL", "Parede de fixture");
    }

    private static byte[] trianglePositions() {
        var buffer = ByteBuffer.allocate(9 * Float.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        for (float value : new float[]{0, 0, 0, 1, 0, 0, 0, 0, 1}) buffer.putFloat(value);
        return buffer.array();
    }

    private static byte[] triangleIndices() { return indices(0, 1, 2); }
    private static byte[] indices(int a, int b, int c) {
        return ByteBuffer.allocate(3 * Integer.BYTES).order(ByteOrder.LITTLE_ENDIAN).putInt(a).putInt(b).putInt(c).array();
    }
}
