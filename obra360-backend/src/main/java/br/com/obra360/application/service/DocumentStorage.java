package br.com.obra360.application.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import java.nio.file.*;
import java.util.UUID;

@Service
public class DocumentStorage {
    private final IntegrationConfig config;private final Path root;
    public DocumentStorage(IntegrationConfig config,@Value("${obra360.storage.directory:./data/documentos}") String directory){this.config=config;root=Path.of(directory).toAbsolutePath().normalize();}
    public boolean s3Configured(){return config.has("S3_BUCKET","AWS_REGION");}
    private S3Client client(){config.require(s3Configured(),"S3");var builder=S3Client.builder().httpClientBuilder(software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient.builder()).region(Region.of(config.get("AWS_REGION"))).serviceConfiguration(software.amazon.awssdk.services.s3.S3Configuration.builder().chunkedEncodingEnabled(false).build()).overrideConfiguration(c->c.apiCallTimeout(java.time.Duration.ofSeconds(30)).apiCallAttemptTimeout(java.time.Duration.ofSeconds(10)));if(config.has("S3_ENDPOINT"))builder.endpointOverride(config.endpoint(config.get("S3_ENDPOINT"))).forcePathStyle(true);return builder.build();}
    public String put(byte[] bytes) throws java.io.IOException {
        String key=UUID.randomUUID().toString();
        if("s3".equalsIgnoreCase(config.get("DOCUMENT_STORAGE","local"))) {
            try(var s3=client()){s3.putObject(PutObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/"+key).contentType("application/octet-stream").build(),RequestBody.fromBytes(bytes));}
            return "s3:"+key;
        }
        Files.createDirectories(root);Files.write(root.resolve(key),bytes,StandardOpenOption.CREATE_NEW);return key;
    }
    // A separate namespace prevents the general document adapter from reading HR objects.
    public String putRh(byte[] bytes) throws java.io.IOException {
        String key=UUID.randomUUID().toString();
        if("s3".equalsIgnoreCase(config.get("DOCUMENT_STORAGE","local"))){
            try(var s3=client()){s3.putObject(PutObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/rh/"+key).contentType("application/octet-stream").build(),RequestBody.fromBytes(bytes));}
            return "s3rh:"+key;
        }
        Path directory=root.resolve("rh");Files.createDirectories(directory);Files.write(directory.resolve(key),bytes,StandardOpenOption.CREATE_NEW);return "rh:"+key;
    }
    private String rhKey(String reference){
        if(reference==null||!reference.matches("(rh:|s3rh:)[0-9a-fA-F-]{36}"))throw new IllegalArgumentException("Referência privada inválida.");
        return reference.substring(reference.indexOf(':')+1);
    }
    public byte[] readRh(String reference) throws java.io.IOException {
        String key=rhKey(reference);
        if(reference.startsWith("s3rh:")){try(var s3=client()){return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/rh/"+key).build()).asByteArray();}}
        return Files.readAllBytes(root.resolve("rh").resolve(key));
    }
    public void deleteRh(String reference) throws java.io.IOException {
        String key=rhKey(reference);
        if(reference.startsWith("s3rh:")){try(var s3=client()){s3.deleteObject(DeleteObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/rh/"+key).build());}}
        else Files.deleteIfExists(root.resolve("rh").resolve(key));
    }
    private String key(String reference){String key=reference.startsWith("s3:")?reference.substring(3):reference;if(!key.matches("[0-9a-fA-F-]{36}"))throw new IllegalArgumentException("Referência de arquivo inválida.");return key;}
    public byte[] read(String reference) throws java.io.IOException {
        String key=key(reference);
        if(reference.startsWith("s3:")){try(var s3=client()){return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/"+key).build()).asByteArray();}}
        return Files.readAllBytes(root.resolve(key));
    }
    public void delete(String reference) throws java.io.IOException {
        String key=key(reference);
        if(reference.startsWith("s3:")){try(var s3=client()){s3.deleteObject(DeleteObjectRequest.builder().bucket(config.get("S3_BUCKET")).key("obra360/"+key).build());}}
        else Files.deleteIfExists(root.resolve(key));
    }
}

