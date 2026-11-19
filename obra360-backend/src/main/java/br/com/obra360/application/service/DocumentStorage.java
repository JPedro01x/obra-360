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
    @org.springframework.beans.factory.annotation.Autowired(required=false)
    private TenantStorageQuota tenantQuota;
    @jakarta.annotation.PostConstruct void validateQuota(){if(maxBytes<1)throw new IllegalArgumentException("DOCUMENT_STORAGE_MAX_BYTES deve ser positivo.");}
    public DocumentStorage(@Value("${obra360.storage.directory:./data/documentos}") String directory) {
        root=Path.of(directory).toAbsolutePath().normalize();
    }
    public synchronized String put(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Files.createDirectories(root);
        checkQuota(bytes.length);
        writeAccounted(root.resolve(key),key,bytes);
        return key;
    }
    public synchronized String putRh(byte[] bytes) throws IOException {
        String key=UUID.randomUUID().toString();
        Path directory=root.resolve("rh");
        Files.createDirectories(directory);
        checkQuota(bytes.length);
        writeAccounted(directory.resolve(key),"rh:"+key,bytes);
        return "rh:"+key;
    }
    private Long tenant(){return br.com.obra360.infrastructure.security.TenantContext.getCurrentTenant();}
    private void writeAccounted(Path file,String reference,byte[] bytes)throws IOException {
        if(tenantQuota!=null)tenantQuota.reserve(reference,tenant(),bytes.length);
        try {write(file,bytes);}
        catch(IOException|RuntimeException ex){if(tenantQuota!=null && Files.notExists(file,LinkOption.NOFOLLOW_LINKS))tenantQuota.release(reference);throw ex;}
        if(org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive())
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization(){
                @Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED)synchronized(DocumentStorage.this){try{Files.deleteIfExists(file);if(tenantQuota!=null)tenantQuota.release(reference);}catch(IOException|RuntimeException ex){org.slf4j.LoggerFactory.getLogger(DocumentStorage.class).warn("Storage rollback cleanup incomplete; reconcile retained reservation.");}}}
            });
    }
    private void authorize(String reference){if(tenantQuota!=null)tenantQuota.authorize(reference,tenant());}
    private synchronized void remove(Path file,String reference)throws IOException {
        authorize(reference);
        if(org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive() && org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization(){
                @Override public void afterCommit(){try{removeNow(file,reference);}catch(IOException|RuntimeException ex){org.slf4j.LoggerFactory.getLogger(DocumentStorage.class).warn("Storage deletion cleanup incomplete; reconcile retained reservation.");}}
            });
        }else removeNow(file,reference);
    }
    private synchronized void removeNow(Path file,String reference)throws IOException {
        Files.deleteIfExists(file);if(tenantQuota!=null)tenantQuota.release(reference);
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
        return key.toLowerCase(java.util.Locale.ROOT);
    }
    public byte[] read(String reference) throws IOException {String id=key(reference,false);authorize(id);return Files.readAllBytes(root.resolve(id));}
    public void delete(String reference) throws IOException {String id=key(reference,false);remove(root.resolve(id),id);}
    public byte[] readRh(String reference) throws IOException {String id=key(reference,true);authorize("rh:"+id);return Files.readAllBytes(root.resolve("rh").resolve(id));}
    public void deleteRh(String reference) throws IOException {String id=key(reference,true);remove(root.resolve("rh").resolve(id),"rh:"+id);}
}
