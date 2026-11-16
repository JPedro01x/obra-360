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
    @Value("${DOCUMENT_STORAGE_MAX_BYTES:10737418240}")
    private long maxBytes=10L*1024*1024*1024;
    private long reservedBytes;
    @jakarta.annotation.PostConstruct void validateQuota(){if(maxBytes<1)throw new IllegalArgumentException("DOCUMENT_STORAGE_MAX_BYTES deve ser positivo.");}
    public DocumentStorage(@Value("${obra360.storage.directory:./data/documentos}") String directory) {
        root=Path.of(directory).toAbsolutePath().normalize();
    }
    public synchronized String put(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Files.createDirectories(root);
        checkQuota(bytes.length);
        write(root.resolve(key),bytes);
        return key;
    }
    public synchronized String putRh(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Path directory=root.resolve("rh");
        Files.createDirectories(directory);
        checkQuota(bytes.length);
        write(directory.resolve(key),bytes);
        return "rh:"+key;
    }
    private void write(Path file,byte[] bytes)throws IOException{
        try{Files.write(file,bytes,StandardOpenOption.CREATE_NEW);}
        catch(FileAlreadyExistsException ex){throw ex;}
        catch(IOException ex){try{Files.deleteIfExists(file);}catch(IOException cleanup){ex.addSuppressed(cleanup);}throw ex;}
    }
    private void checkQuota(int incoming) throws IOException {
        if(maxBytes<1)throw new IllegalStateException("DOCUMENT_STORAGE_MAX_BYTES deve ser positivo.");
        long used=0;
        try(var files=Files.walk(root)) {
            var iterator=files.filter(p->Files.isRegularFile(p,LinkOption.NOFOLLOW_LINKS)).iterator();
            while(iterator.hasNext()) {used=Math.addExact(used,Files.size(iterator.next()));if(used>maxBytes)break;}
        }
        if(incoming>maxBytes-used-reservedBytes)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INSUFFICIENT_STORAGE,"Limite de armazenamento local atingido. Contate o administrador do servidor.");
    }
    public synchronized AutoCloseable reserveExport() throws IOException {
        Files.createDirectories(root);checkQuota(300*1024*1024);reservedBytes+=300L*1024*1024;
        var closed=new java.util.concurrent.atomic.AtomicBoolean();
        return ()->{synchronized(this){if(closed.compareAndSet(false,true))reservedBytes-=300L*1024*1024;}};
    }
    public Path exportPath(String id) throws IOException {
        if(!UUID.fromString(id).toString().equals(id))throw new IllegalArgumentException("Identificador inválido.");
        Path directory=root.resolve("exportacoes");Files.createDirectories(directory);return directory.resolve(id+".zip");
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
