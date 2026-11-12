package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.*;
import java.security.*;
import java.time.OffsetDateTime;
import java.util.*;

@Service @Transactional
public class QualidadeService {
    private final EntityManager em;
    private final OperacaoService operations;
    private final DocumentStorage storage;
    private final NotificacaoService notifications;
    private final java.util.concurrent.Semaphore processingSlots=new java.util.concurrent.Semaphore(2);
    public QualidadeService(EntityManager em,OperacaoService operations,DocumentStorage storage,NotificacaoService notifications) {
        this.em=em;this.operations=operations;this.storage=storage;this.notifications=notifications;
    }
    private ResponseStatusException bad(String message) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private OcorrenciaQualidadeEntity own(Long id) {
        var occurrence=em.find(OcorrenciaQualidadeEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(occurrence==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        // The existing occurrence already prevents project deletion. Check ownership
        // without serializing independent photo uploads on the same project.
        var project=em.find(ProjetoObraEntity.class,occurrence.getProjetoObraId());
        if(project==null || !TenantContext.getCurrentTenant().equals(project.getEmpresaId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return occurrence;
    }
    public OcorrenciaQualidadeEntity create(Long project,Long responsible,String title,String standard,String severity,MultipartFile photo,Long actor) {
        operations.project(project);operations.member(responsible);
        if(Set.of("ALTA","CRITICA").contains(severity) && (photo==null || photo.isEmpty()))
            throw bad("Ocorrência alta ou crítica exige uma foto PNG ou JPEG.");
        var occurrence=OcorrenciaQualidadeEntity.builder().projetoObraId(project).responsavelId(responsible).titulo(title.trim())
            .normaRegulamentadora(standard.trim()).grauSeveridade(severity).statusPlanoAcao("PENDENTE").build();
        em.persist(occurrence);
        if(photo!=null && !photo.isEmpty()) attach(occurrence.getId(),photo,actor);
        operations.audit("REGISTRAR_OCORRENCIA","ocorrencia_qualidade",occurrence.getId(),actor);
        notifications.send(responsible,"Nova ocorrência de qualidade atribuída a você: "+title.trim()+".");return occurrence;
    }
    public OcorrenciaQualidadeEntity state(Long id,String state,Long actor) {
        var occurrence=own(id);
        if("RESOLVIDO".equals(occurrence.getStatusPlanoAcao()) && !state.equals(occurrence.getStatusPlanoAcao()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Uma ocorrência resolvida não pode ser reaberta por esta operação.");
        if("RESOLVIDO".equals(state) && Set.of("ALTA","CRITICA").contains(occurrence.getGrauSeveridade()) && evidence(id).isEmpty())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Anexe a evidência fotográfica antes de resolver a ocorrência.");
        occurrence.setStatusPlanoAcao(state);operations.audit("OCORRENCIA_"+state,"ocorrencia_qualidade",id,actor);return occurrence;
    }
    public List<EvidenciaQualidadeEntity> evidence(Long id) {
        own(id);
        return em.createQuery("select e from EvidenciaQualidadeEntity e where e.ocorrenciaId=:id and e.empresaId=:t order by e.id",EvidenciaQualidadeEntity.class)
            .setParameter("id",id).setParameter("t",TenantContext.getCurrentTenant()).getResultList();
    }
    public EvidenciaQualidadeEntity attach(Long id,MultipartFile file,Long actor) {
        var occurrence=own(id);
        if("RESOLVIDO".equals(occurrence.getStatusPlanoAcao())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Ocorrência resolvida não aceita novos arquivos.");
        if(evidence(id).size()>=20) throw bad("Limite de 20 fotos por ocorrência.");
        if(file==null || file.isEmpty() || file.getSize()>5L*1024*1024) throw bad("Informe uma foto PNG ou JPEG de até 5 MB.");
        if(!processingSlots.tryAcquire()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Processamento de fotos ocupado. Tente novamente em instantes.");
        try {
        byte[] normalized;String format;
        try(var input=new MemoryCacheImageInputStream(new ByteArrayInputStream(file.getBytes()))) {
            var readers=ImageIO.getImageReaders(input);
            if(!readers.hasNext()) throw bad("O arquivo não contém uma imagem válida.");
            var reader=readers.next();
            try {
                reader.setInput(input,false,true);format=reader.getFormatName().toLowerCase(Locale.ROOT);
                if(!Set.of("png","jpeg","jpg").contains(format)) throw bad("Somente PNG e JPEG são permitidos.");
                int width=reader.getWidth(0),height=reader.getHeight(0);
                if(width<1 || height<1 || width>8192 || height>8192 || (long)width*height>12_000_000)
                    throw bad("A foto excede o limite de 12 megapixels ou 8192 pixels por lado.");
                String mime=format.equals("png")?"image/png":"image/jpeg";
                if(!mime.equalsIgnoreCase(file.getContentType())) throw bad("O tipo informado não corresponde ao conteúdo da foto.");
                var image=reader.read(0);
                try(var output=new ByteArrayOutputStream()) {
                    if(!ImageIO.write(image,format,output)) throw bad("Não foi possível normalizar a imagem.");
                    normalized=output.toByteArray();
                } finally {image.flush();}
            } finally {reader.dispose();}
        } catch(IOException | IllegalArgumentException ex) {throw bad("Não foi possível ler a imagem.");}
        if(normalized.length>10L*1024*1024) throw bad("A imagem normalizada excede 10 MB.");
        try {
            String key=storage.put(normalized);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if(status!=STATUS_COMMITTED) try {storage.delete(key);} catch(IOException ex) {
                        org.slf4j.LoggerFactory.getLogger(QualidadeService.class).error("Falha ao remover evidência após rollback; revisar armazenamento.");
                    }
                }
            });
            var evidence=new EvidenciaQualidadeEntity();evidence.setEmpresaId(TenantContext.getCurrentTenant());evidence.setOcorrenciaId(id);
            evidence.setUsuarioId(actor);evidence.setArquivoKey(key);evidence.setSha256(hash(normalized));
            evidence.setMime(format.equals("png")?"image/png":"image/jpeg");evidence.setTamanho(normalized.length);evidence.setDataCriacao(OffsetDateTime.now());
            em.persist(evidence);operations.audit("ANEXAR_EVIDENCIA","evidencia_qualidade",evidence.getId(),actor);return evidence;
        } catch(IOException ex) {throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Não foi possível armazenar a evidência.");}
        } finally {processingSlots.release();}
    }
    public record Photo(EvidenciaQualidadeEntity evidence,byte[] bytes) {}
    public Photo download(Long occurrenceId,Long evidenceId) {
        own(occurrenceId);var evidence=em.find(EvidenciaQualidadeEntity.class,evidenceId);
        if(evidence==null || !occurrenceId.equals(evidence.getOcorrenciaId()) || !TenantContext.getCurrentTenant().equals(evidence.getEmpresaId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        try {
            byte[] bytes=storage.read(evidence.getArquivoKey());
            if(!hash(bytes).equals(evidence.getSha256())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Integridade da evidência divergente.");
            return new Photo(evidence,bytes);
        } catch(IOException ex) {throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Evidência indisponível no armazenamento.");}
    }
    private String hash(byte[] bytes) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}
        catch(NoSuchAlgorithmException ex) {throw new IllegalStateException(ex);}
    }
}
