package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.DocumentoProjetoEntity;
import br.com.obra360.domain.entity.ProjetoObraEntity;
import jakarta.persistence.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/documentos")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','AUDITOR')")
public class DocumentoOperacionalController {
    private final EntityManager em;private final OperacaoService operation;private final br.com.obra360.application.service.DocumentStorage storage;
    public DocumentoOperacionalController(EntityManager em,OperacaoService operation,br.com.obra360.application.service.DocumentStorage storage) {
        this.em=em;this.operation=operation;this.storage=storage;
    }
    @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED) @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public DocumentoProjetoEntity upload(@RequestParam Long projetoObraId,@RequestParam String titulo,@RequestParam String tipoDocumento,
        @RequestParam(required=false) Long documentoAnteriorId,@RequestParam MultipartFile arquivo,Authentication a) throws Exception {
        var project=operation.project(projetoObraId);em.lock(project,LockModeType.PESSIMISTIC_WRITE);
        if(titulo.isBlank() || titulo.length()>255 || tipoDocumento.isBlank() || tipoDocumento.length()>50 || arquivo.isEmpty() || arquivo.getSize()>20*1024*1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Confira o documento (limite de 20 MB).");
        String original=Optional.ofNullable(arquivo.getOriginalFilename()).orElse("documento").replaceAll("[\\p{Cntrl}\\\\/]","_");
        if(original.length()>255) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        int version=1;
        if(documentoAnteriorId!=null) {
            var old=em.find(DocumentoProjetoEntity.class,documentoAnteriorId);
            if(old==null || !old.getProjetoObraId().equals(projetoObraId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            if(!old.getTitulo().equals(titulo.trim())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use o mesmo título para uma nova versão.");
            version=em.createQuery("select max(d.versao) from DocumentoProjetoEntity d where d.projetoObraId=:p and d.titulo=:t",Integer.class)
                .setParameter("p",projetoObraId).setParameter("t",titulo.trim()).getSingleResult()+1;
        }
        byte[] bytes=arquivo.getBytes();String key=storage.put(bytes);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if(status!=STATUS_COMMITTED) try {storage.delete(key);} catch(Exception ignored) {}
            }
        });
        var doc=DocumentoProjetoEntity.builder().projetoObraId(projetoObraId).titulo(titulo.trim()).tipoDocumento(tipoDocumento.trim())
            .nomeArquivo(original).urlArmazenamento(key).hashArquivoSha256(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))).versao(version).build();
        em.persist(doc);operation.audit("ENVIAR_DOCUMENTO","documento_projeto",doc.getId(),Long.valueOf(a.getName()));return doc;
    }
    @GetMapping("/{id}/arquivo") @Transactional(readOnly=true)
    public ResponseEntity<org.springframework.core.io.ByteArrayResource> download(@PathVariable Long id) throws Exception {
        var doc=em.find(DocumentoProjetoEntity.class,id);if(doc==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        operation.project(doc.getProjetoObraId());
        String key=doc.getUrlArmazenamento();
        if(key==null || !key.matches("(s3:)?[0-9a-fA-F-]{36}")) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Arquivo indisponível.");
        byte[] bytes;try{bytes=storage.read(key);}catch(java.nio.file.NoSuchFileException ex){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Arquivo indisponível.");}
        String actual=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        if(!actual.equalsIgnoreCase(doc.getHashArquivoSha256())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Integridade do documento divergente. Solicite a revisão do arquivo.");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(doc.getNomeArquivo(),StandardCharsets.UTF_8).build().toString())
            .body(new org.springframework.core.io.ByteArrayResource(bytes));
    }
}
