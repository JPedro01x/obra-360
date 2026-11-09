package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.*;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/rh") @RequiredArgsConstructor
@Transactional @PreAuthorize("hasAnyRole('SUPER_ADMIN','RH')")
public class RhDossieController {
    private final EntityManager em;
    private final DocumentStorage storage;
    private final OperacaoService operation;
    private final ObjectMapper mapper;
    private static final Set<String> CATEGORIES=Set.of("ADMISSAO","CONTRATO","ADITIVO","COMPROVANTE","CERTIFICADO","DESLIGAMENTO","OUTRO");
    private Long tenant(){return TenantContext.getCurrentTenant();}
    private ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
    private <T extends RhBase> T own(Class<T> type,Long id){
        var e=em.find(type,id);if(e==null||!tenant().equals(e.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);return e;
    }
    private void page(int page,int size){if(page<0||page>100000||size<1||size>100)throw bad("Página inválida.");}
    private String hash(byte[] bytes) throws Exception{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}
    private void audit(String action,String entity,Long id,Authentication a){operation.audit(action,entity,id,Long.valueOf(a.getName()));}

    @GetMapping("/documentos")
    public Map<String,Object> documents(@RequestParam(required=false) Long funcionarioId,@RequestParam(defaultValue="0") int page,
        @RequestParam(defaultValue="25") int size,@RequestParam(defaultValue="false") boolean incluirArquivados,Authentication a){
        page(page,size);if(funcionarioId!=null)own(RhFuncionarioEntity.class,funcionarioId);
        String where=" from RhDocumentoEntity e where e.empresaId=:t"+(funcionarioId==null?"":" and e.funcionarioId=:f")+(incluirArquivados?"":" and e.arquivado=false");
        var rows=em.createQuery("select e"+where+" order by e.id desc",RhDocumentoEntity.class);var count=em.createQuery("select count(e)"+where,Long.class);
        rows.setParameter("t",tenant());count.setParameter("t",tenant());if(funcionarioId!=null){rows.setParameter("f",funcionarioId);count.setParameter("f",funcionarioId);}
        audit("RH_CONSULTAR_DOCUMENTOS","rh_funcionario",funcionarioId,a);
        return Map.of("items",rows.setFirstResult(page*size).setMaxResults(size).getResultList(),"total",count.getSingleResult(),"page",page,"size",size);
    }
    @PostMapping(value="/documentos",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public RhDocumentoEntity upload(@RequestParam Long funcionarioId,@RequestParam String titulo,@RequestParam String categoria,
        @RequestParam(required=false) Long documentoAnteriorId,@RequestParam(required=false) LocalDate dataValidade,@RequestParam MultipartFile arquivo,Authentication a) throws Exception {
        var f=own(RhFuncionarioEntity.class,funcionarioId);em.lock(f,LockModeType.PESSIMISTIC_WRITE);
        if(titulo.isBlank()||titulo.trim().length()>150||!CATEGORIES.contains(categoria)||arquivo.isEmpty()||arquivo.getSize()>20*1024*1024)throw bad("Confira título, categoria e arquivo (máximo de 20 MB).");
        String original=Optional.ofNullable(arquivo.getOriginalFilename()).orElse("documento").replaceAll("[\\p{Cntrl}\\\\/]","_").trim();
        if(original.isEmpty()||original.length()>255)throw bad("Nome de arquivo inválido.");
        byte[] bytes=arquivo.getBytes();String mime=mime(bytes,original);
        int number=1;String group=UUID.randomUUID().toString();
        if(documentoAnteriorId!=null){
            var old=own(RhDocumentoEntity.class,documentoAnteriorId);
            em.lock(old,LockModeType.PESSIMISTIC_WRITE);
            if(!f.getId().equals(old.getFuncionarioId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            if(Boolean.TRUE.equals(old.getArquivado()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Documento arquivado não aceita nova versão.");
            if(!old.getTitulo().equals(titulo.trim())||!old.getCategoria().equals(categoria))throw bad("Nova versão deve manter título e categoria.");
            int latest=em.createQuery("select max(e.numeroVersao) from RhDocumentoEntity e where e.empresaId=:t and e.funcionarioId=:f and e.grupo=:g",Integer.class).setParameter("t",tenant()).setParameter("f",f.getId()).setParameter("g",old.getGrupo()).getSingleResult();
            if(latest!=old.getNumeroVersao())throw new ResponseStatusException(HttpStatus.CONFLICT,"Já existe uma versão mais recente. Atualize a lista.");
            number=latest+1;group=old.getGrupo();
        }
        String key=storage.putRh(bytes);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
            @Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED)try{storage.deleteRh(key);}catch(Exception ignored){}}
        });
        var e=new RhDocumentoEntity();e.setEmpresaId(tenant());e.setFuncionarioId(f.getId());e.setUsuarioId(Long.valueOf(a.getName()));e.setGrupo(group);e.setNumeroVersao(number);e.setDocumentoAnteriorId(documentoAnteriorId);e.setTitulo(titulo.trim());e.setCategoria(categoria);e.setNomeArquivo(original);e.setTipoArquivo(mime);e.setTamanho((long)bytes.length);e.setSha256(hash(bytes));e.setReferenciaArquivo(key);e.setDataValidade(dataValidade);e.setArquivado(false);
        em.persist(e);em.flush();audit("RH_ENVIAR_DOCUMENTO","rh_documento",e.getId(),a);return e;
    }
    private String mime(byte[] bytes,String filename){
        String name=filename.toLowerCase(Locale.ROOT);
        if(name.endsWith(".pdf")&&bytes.length>=5&&new String(bytes,0,5,StandardCharsets.US_ASCII).equals("%PDF-"))return "application/pdf";
        if(name.endsWith(".png")&&bytes.length>=8&&Arrays.equals(Arrays.copyOf(bytes,8),new byte[]{(byte)137,80,78,71,13,10,26,10}))return "image/png";
        if((name.endsWith(".jpg")||name.endsWith(".jpeg"))&&bytes.length>=3&&(bytes[0]&255)==255&&(bytes[1]&255)==216&&(bytes[2]&255)==255)return "image/jpeg";
        throw bad("Envie PDF, PNG ou JPEG com conteúdo compatível com a extensão.");
    }
    @GetMapping("/documentos/{id}/arquivo")
    public ResponseEntity<ByteArrayResource> download(@PathVariable Long id,Authentication a) throws Exception {
        var e=own(RhDocumentoEntity.class,id);own(RhFuncionarioEntity.class,e.getFuncionarioId());
        byte[] bytes;try{bytes=storage.readRh(e.getReferenciaArquivo());}catch(java.nio.file.NoSuchFileException|software.amazon.awssdk.services.s3.model.NoSuchKeyException ex){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Arquivo privado indisponível.");}
        if(bytes.length!=e.getTamanho()||!MessageDigest.isEqual(hash(bytes).getBytes(StandardCharsets.US_ASCII),e.getSha256().getBytes(StandardCharsets.US_ASCII)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Integridade do arquivo divergente. Restaure uma cópia verificada antes de utilizar.");
        audit("RH_BAIXAR_DOCUMENTO","rh_documento",e.getId(),a);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).cacheControl(CacheControl.noStore())
            .header(HttpHeaders.PRAGMA,"no-cache").header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(e.getNomeArquivo(),StandardCharsets.UTF_8).build().toString())
            .body(new ByteArrayResource(bytes));
    }
    @PatchMapping("/documentos/{id}/arquivo-status")
    public RhDocumentoEntity archive(@PathVariable Long id,@Valid @RequestBody ArchiveRequest r,Authentication a){
        var e=own(RhDocumentoEntity.class,id);em.lock(e,LockModeType.PESSIMISTIC_WRITE);
        if(e.getVersao()!=r.versao())throw new ResponseStatusException(HttpStatus.CONFLICT,"Documento alterado. Atualize a lista.");
        e.setArquivado(r.arquivado());em.flush();audit(r.arquivado()?"RH_ARQUIVAR_DOCUMENTO":"RH_REATIVAR_DOCUMENTO","rh_documento",id,a);return e;
    }
    @GetMapping("/historico")
    public Map<String,Object> history(@RequestParam(required=false) Long funcionarioId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="25") int size,Authentication a) throws Exception {
        page(page,size);if(funcionarioId!=null)own(RhFuncionarioEntity.class,funcionarioId);
        String where=" from RhHistoricoEntity e where e.empresaId=:t"+(funcionarioId==null?"":" and e.funcionarioId=:f");
        var rows=em.createQuery("select e"+where+" order by e.id desc",RhHistoricoEntity.class);var count=em.createQuery("select count(e)"+where,Long.class);
        rows.setParameter("t",tenant());count.setParameter("t",tenant());if(funcionarioId!=null){rows.setParameter("f",funcionarioId);count.setParameter("f",funcionarioId);}
        List<Map<String,Object>> items=new ArrayList<>();
        for(var e:rows.setFirstResult(page*size).setMaxResults(size).getResultList()){
            Map<String,Object> value=new LinkedHashMap<>();value.put("id",e.getId());value.put("funcionarioId",e.getFuncionarioId());value.put("usuarioId",e.getUsuarioId());
            var actor=em.find(UsuarioEntity.class,e.getUsuarioId());value.put("responsavel",actor==null?"Usuário #"+e.getUsuarioId():actor.getNome());
            value.put("tipo",e.getTipo());value.put("motivo",e.getMotivo());value.put("dataReferencia",e.getDataReferencia());value.put("registradoEm",e.getCriadoEm());
            value.put("camposAlterados",e.getCamposAlterados().isEmpty()?List.of():List.of(e.getCamposAlterados().split(",")));
            value.put("anterior",e.getEstadoAnterior()==null?null:mapper.readTree(e.getEstadoAnterior()));value.put("atual",mapper.readTree(e.getEstadoAtual()));items.add(value);
        }
        audit("RH_CONSULTAR_HISTORICO","rh_funcionario",funcionarioId,a);
        return Map.of("items",items,"total",count.getSingleResult(),"page",page,"size",size);
    }
    public record ArchiveRequest(@NotNull Boolean arquivado,@Min(0) long versao){}
}
