package br.com.obra360.application.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

/** Private local storage; user-supplied filenames never determine disk paths. */
@Service
public class DocumentStorage {
    private final Path root;
    public DocumentStorage(@Value("${obra360.storage.directory:./data/documentos}") String directory) {
        root=Path.of(directory).toAbsolutePath().normalize();
    }
    public String put(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Files.createDirectories(root);
        Files.write(root.resolve(key),bytes,StandardOpenOption.CREATE_NEW);
        return key;
    }
    public String putRh(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Path directory=root.resolve("rh");
        Files.createDirectories(directory);
        Files.write(directory.resolve(key),bytes,StandardOpenOption.CREATE_NEW);
        return "rh:"+key;
    }
    private String key(String reference,boolean hr) throws IOException {
        // A former external reference must never resolve to an unrelated local file.
        if(reference!=null && (reference.startsWith("s3:") || reference.startsWith("s3rh:")))
            throw new NoSuchFileException("Arquivo externo não disponível no armazenamento local.");
        String pattern=hr ? "rh:[0-9a-fA-F-]{36}" : "[0-9a-fA-F-]{36}";
        if(reference==null || !reference.matches(pattern))throw new IllegalArgumentException("Referência de arquivo inválida.");
        String key=hr ? reference.substring(3) : reference;
        try {if(!UUID.fromString(key).toString().equalsIgnoreCase(key))throw new IllegalArgumentException();}
        catch(IllegalArgumentException ex){throw new IllegalArgumentException("Referência de arquivo inválida.");}
        return key;
    }
    public byte[] read(String reference) throws IOException {return Files.readAllBytes(root.resolve(key(reference,false)));}
    public void delete(String reference) throws IOException {Files.deleteIfExists(root.resolve(key(reference,false)));}
    public byte[] readRh(String reference) throws IOException {return Files.readAllBytes(root.resolve("rh").resolve(key(reference,true)));}
    public void deleteRh(String reference) throws IOException {Files.deleteIfExists(root.resolve("rh").resolve(key(reference,true)));}
}
