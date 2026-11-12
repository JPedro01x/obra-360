package br.com.obra360.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;

class DocumentStorageTest {
    @TempDir Path directory;

    @Test void localFilesPersistAcrossInstancesAndHrRemainsIsolated() throws Exception {
        var storage=new DocumentStorage(directory.toString());
        byte[] bytes="Documento privado".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String general=storage.put(bytes),hr=storage.putRh(bytes);
        var reopened=new DocumentStorage(directory.toString());
        assertArrayEquals(bytes,reopened.read(general));
        assertArrayEquals(bytes,reopened.readRh(hr));
        assertTrue(Files.exists(directory.resolve(general)));
        assertTrue(Files.exists(directory.resolve("rh").resolve(hr.substring(3))));
        assertThrows(IllegalArgumentException.class,()->reopened.read(hr));
        assertThrows(IllegalArgumentException.class,()->reopened.readRh(general));
        reopened.delete(general);reopened.deleteRh(hr);
        assertThrows(NoSuchFileException.class,()->reopened.read(general));
        assertThrows(NoSuchFileException.class,()->reopened.readRh(hr));
    }
    @Test void invalidPathsAndFormerCloudReferencesNeverResolveToLocalFiles() throws Exception {
        var storage=new DocumentStorage(directory.toString());
        String key=storage.put(new byte[]{1,2,3});
        assertThrows(IllegalArgumentException.class,()->storage.read("../"+key));
        assertThrows(NoSuchFileException.class,()->storage.read("s3:"+key));
        assertThrows(NoSuchFileException.class,()->storage.delete("s3:"+key));
        assertThrows(NoSuchFileException.class,()->storage.readRh("s3rh:"+key));
        assertTrue(Files.exists(directory.resolve(key)));
    }
}
