package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.application.model.MedicaoFisicaItem;
import br.com.obra360.application.usecase.ListMedicoesFisicas;
import br.com.obra360.application.usecase.ProjectNotFoundException;
import br.com.obra360.domain.entity.EtapaCronogramaEntity;
import br.com.obra360.domain.entity.MedicaoFisicaEntity;
import br.com.obra360.domain.entity.MedicaoFisicaAnexoEntity;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.CacheControl;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.HexFormat;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@RestController @RequestMapping("/api/v1/workspace/medicoes") @RequiredArgsConstructor @Transactional
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','FINANCEIRO','INCORPORADOR','AUDITOR')")
public class MedicaoFisicaController {
    private final EntityManager em;
    private final OperacaoService operation;
    private final br.com.obra360.application.service.DocumentStorage storage;
    private final ListMedicoesFisicas listMedicoes;

    @GetMapping
    @Transactional(readOnly=true)
    public PageResult list(@RequestParam @Positive Long projetoObraId,
        @RequestParam(defaultValue="0") @Min(0) @Max(100000) int page) {
        try {
            var result=listMedicoes.execute(tenant(),projetoObraId,page);
            return new PageResult(result.items(),result.total(),result.page(),result.size());
        } catch(ProjectNotFoundException missing) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Projeto não encontrado nesta empresa.");
        }
    }

    @GetMapping("/{id}/historico")
    @Transactional(readOnly=true)
    public List<EventRecord> history(@PathVariable @Positive Long id) {
        own(id,null);
        @SuppressWarnings("unchecked") List<Object[]> rows=em.createNativeQuery("select e.id,e.usuario_id,u.nome,e.acao,e.status_anterior,e.status_novo,e.criado_em from medicao_fisica_evento e join usuario u on u.id=e.usuario_id and u.empresa_id=e.empresa_id where e.empresa_id=:t and e.medicao_id=:m order by e.criado_em,e.id")
            .setParameter("t",tenant()).setParameter("m",id).getResultList();
        return rows.stream().map(r->new EventRecord(((Number)r[0]).longValue(),((Number)r[1]).longValue(),String.valueOf(r[2]),
            String.valueOf(r[3]),r[4]==null?null:String.valueOf(r[4]),String.valueOf(r[5]),String.valueOf(r[6]))).toList();
    }

    @GetMapping("/{id}/anexos")
    @Transactional(readOnly=true)
    public List<AttachmentRecord> attachments(@PathVariable @Positive Long id) {
        own(id,null);
        return em.createQuery("select a from MedicaoFisicaAnexoEntity a where a.empresaId=:t and a.medicaoId=:m order by a.criadoEm,a.id",MedicaoFisicaAnexoEntity.class)
            .setParameter("t",tenant()).setParameter("m",id).getResultList().stream()
            .map(a->new AttachmentRecord(a.getId(),a.getNomeArquivo(),a.getMime(),a.getTamanho(),a.getSha256(),a.getUsuarioId(),String.valueOf(a.getCriadoEm()))).toList();
    }

    @PostMapping(value="/{id}/anexos",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public AttachmentRecord attach(@PathVariable @Positive Long id,@RequestParam("arquivo") MultipartFile file,Authentication auth) {
        var measurement=own(id,LockModeType.PESSIMISTIC_WRITE);
        if(!"EM_MEDICAO".equals(measurement.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Anexe evidências antes da aprovação da medição.");
        if(file==null || file.isEmpty() || file.getSize()>20L*1024*1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Anexe um PDF, PNG ou JPEG de até 20 MB.");
        long count=em.createQuery("select count(a) from MedicaoFisicaAnexoEntity a where a.empresaId=:t and a.medicaoId=:m",Long.class)
            .setParameter("t",tenant()).setParameter("m",id).getSingleResult();
        if(count>=20)throw new ResponseStatusException(HttpStatus.CONFLICT,"Limite de 20 anexos por medição.");
        try {
            byte[] bytes=file.getBytes();String mime=detectMime(bytes);
            if(!mime.equalsIgnoreCase(file.getContentType()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"O tipo informado não corresponde ao conteúdo do arquivo.");
            String original=normalizeFileName(file.getOriginalFilename(),mime);
            String key=storage.put(bytes),digest=hash(bytes);
            var attachment=MedicaoFisicaAnexoEntity.builder().empresaId(tenant()).medicaoId(measurement.getId())
                .usuarioId(user(auth)).nomeArquivo(original).arquivoKey(key).sha256(digest).mime(mime).tamanho((long)bytes.length).build();
            em.persist(attachment);audit("ANEXAR_EVIDENCIA_MEDICAO",attachment,auth);
            return new AttachmentRecord(attachment.getId(),original,mime,(long)bytes.length,digest,user(auth),String.valueOf(attachment.getCriadoEm()));
        } catch(ResponseStatusException ex){throw ex;}
        catch(Exception ex){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Não foi possível armazenar o anexo.");}
    }

    @GetMapping("/{id}/anexos/{attachmentId}/arquivo")
    @Transactional(readOnly=true)
    public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable @Positive Long id,@PathVariable @Positive Long attachmentId) {
        own(id,null);
        var attachment=em.createQuery("select a from MedicaoFisicaAnexoEntity a where a.id=:a and a.empresaId=:t and a.medicaoId=:m",MedicaoFisicaAnexoEntity.class)
            .setParameter("a",attachmentId).setParameter("t",tenant()).setParameter("m",id).getResultStream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        try {
            byte[] bytes=storage.read(attachment.getArquivoKey());
            if(!hash(bytes).equalsIgnoreCase(attachment.getSha256()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Integridade do anexo divergente.");
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(attachment.getMime())).cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options","nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,org.springframework.http.ContentDisposition.attachment().filename(attachment.getNomeArquivo(),StandardCharsets.UTF_8).build().toString())
                .body(new ByteArrayResource(bytes));
        } catch(ResponseStatusException ex){throw ex;}
        catch(Exception ex){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Anexo indisponível no armazenamento.");}
    }

    private String detectMime(byte[] bytes) {
        if(bytes.length>=5 && bytes[0]=='%' && bytes[1]=='P' && bytes[2]=='D' && bytes[3]=='F' && bytes[4]=='-')return "application/pdf";
        if(bytes.length>=8 && (bytes[0]&255)==0x89 && bytes[1]=='P' && bytes[2]=='N' && bytes[3]=='G' && (bytes[4]&255)==0x0d && (bytes[5]&255)==0x0a && (bytes[6]&255)==0x1a && (bytes[7]&255)==0x0a)return "image/png";
        if(bytes.length>=3 && (bytes[0]&255)==0xff && (bytes[1]&255)==0xd8 && (bytes[2]&255)==0xff)return "image/jpeg";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Formato inválido. São aceitos PDF, PNG e JPEG.");
    }
    private String normalizeFileName(String filename,String mime) {
        String extension=switch(mime) {
            case "application/pdf" -> ".pdf";
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Formato não permitido.");
        };
        String safe=java.util.Optional.ofNullable(filename).orElse("evidencia")
            .replaceAll("[\\p{Cntrl}\\\\/:*?\"<>|]","_").trim();
        if(safe.isBlank())safe="evidencia";
        int dot=safe.lastIndexOf('.');
        String supplied=dot>=0?safe.substring(dot).toLowerCase(java.util.Locale.ROOT):"";
        boolean matches=switch(mime) {
            case "application/pdf" -> supplied.isEmpty() || supplied.equals(".pdf");
            case "image/png" -> supplied.isEmpty() || supplied.equals(".png");
            case "image/jpeg" -> supplied.isEmpty() || supplied.equals(".jpg") || supplied.equals(".jpeg");
            default -> false;
        };
        if(!matches)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A extensão do arquivo não corresponde ao seu conteúdo.");
        if(supplied.isEmpty())safe+=extension;
        else if(!safe.endsWith(extension) && mime.equals("image/jpeg"))safe=safe.substring(0,dot)+extension;
        if(safe.length()>255) {
            int prefix=Math.max(1,255-extension.length());
            if(Character.isHighSurrogate(safe.charAt(prefix-1)))prefix--;
            safe=safe.substring(0,prefix)+extension;
        }
        return safe;
    }
    private String hash(byte[] bytes) {
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}
        catch(java.security.NoSuchAlgorithmException ex){throw new IllegalStateException(ex);}
    }
    private void audit(String action,MedicaoFisicaAnexoEntity a,Authentication auth){operation.audit(action,"medicao_fisica_anexo",a.getId(),user(auth));}

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public MedicaoFisicaEntity create(@Valid @RequestBody Request r,Authentication auth) {
        operation.project(r.projetoObraId());
        var stage=stage(r.etapaCronogramaId(),r.projetoObraId(),true);
        Long duplicates=em.createQuery("select count(m) from MedicaoFisicaEntity m where m.empresaId=:t and m.etapaCronogramaId=:e and m.competencia=:c",Long.class)
            .setParameter("t",tenant()).setParameter("e",r.etapaCronogramaId()).setParameter("c",r.competencia()).getSingleResult();
        if(duplicates>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Já existe medição desta etapa para a competência informada.");
        if(r.percentualMedido().compareTo(stage.getPercentualExecutado())<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"O avanço medido não pode ser menor que o avanço registrado na etapa.");
        var e=MedicaoFisicaEntity.builder().empresaId(tenant()).projetoObraId(r.projetoObraId())
            .etapaCronogramaId(r.etapaCronogramaId()).competencia(r.competencia()).descricao(r.descricao().trim())
            .quantidade(r.quantidade()).unidade(r.unidade().trim()).percentualAnterior(stage.getPercentualExecutado())
            .percentualMedido(r.percentualMedido()).valorMedido(r.valorMedido()).status("EM_MEDICAO")
            .criadoPor(user(auth)).build();
        em.persist(e);event(e,"CRIADA",null,e.getStatus(),auth);audit("CRIAR_MEDICAO_FISICA",e,auth);return e;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR')")
    public MedicaoFisicaEntity update(@PathVariable @Positive Long id,@Valid @RequestBody UpdateRequest r,Authentication auth) {
        var e=own(id,LockModeType.PESSIMISTIC_WRITE);
        if(!"EM_MEDICAO".equals(e.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Somente medições em análise podem ser editadas.");
        var stage=stage(e.getEtapaCronogramaId(),e.getProjetoObraId(),true);
        if(r.percentualMedido().compareTo(stage.getPercentualExecutado())<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"O percentual já executado na etapa não pode ser reduzido.");
        e.setDescricao(r.descricao().trim());e.setQuantidade(r.quantidade());e.setUnidade(r.unidade().trim());
        e.setPercentualMedido(r.percentualMedido());e.setValorMedido(r.valorMedido());
        event(e,"EDITADA","EM_MEDICAO","EM_MEDICAO",auth);audit("ATUALIZAR_MEDICAO_FISICA",e,auth);return e;
    }

    @PostMapping("/{id}/aprovar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ENGENHEIRO')")
    public MedicaoFisicaEntity approve(@PathVariable @Positive Long id,Authentication auth) {
        var e=own(id,LockModeType.PESSIMISTIC_WRITE);requireStatus(e,"EM_MEDICAO");
        var stage=stage(e.getEtapaCronogramaId(),e.getProjetoObraId(),true);
        if(stage.getPercentualExecutado().compareTo(e.getPercentualAnterior())!=0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"O avanço da etapa mudou desde esta medição. Atualize o percentual antes de aprovar.");
        stage.setPercentualExecutado(e.getPercentualMedido());e.setStatus("APROVADO_ENGENHEIRO");e.setAprovadoPor(user(auth));
        event(e,"APROVADA","EM_MEDICAO",e.getStatus(),auth);audit("APROVAR_MEDICAO_FISICA",e,auth);return e;
    }

    @PostMapping("/{id}/liberar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','FINANCEIRO')")
    public MedicaoFisicaEntity release(@PathVariable @Positive Long id,Authentication auth) {
        var e=own(id,LockModeType.PESSIMISTIC_WRITE);requireStatus(e,"APROVADO_ENGENHEIRO");
        e.setStatus("LIBERADO_FINANCEIRO");e.setLiberadoPor(user(auth));
        event(e,"LIBERADA_FINANCEIRO","APROVADO_ENGENHEIRO",e.getStatus(),auth);audit("LIBERAR_MEDICAO_FINANCEIRA",e,auth);return e;
    }

    private MedicaoFisicaEntity own(Long id,LockModeType lock){
        var q=em.createQuery("select m from MedicaoFisicaEntity m where m.id=:id and m.empresaId=:t",MedicaoFisicaEntity.class).setParameter("id",id).setParameter("t",tenant());
        if(lock!=null)q.setLockMode(lock);return q.getResultStream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    private EtapaCronogramaEntity stage(Long id,Long project,boolean lock){
        var q=em.createQuery("select e from EtapaCronogramaEntity e where e.id=:id and e.projetoObraId=:p",EtapaCronogramaEntity.class).setParameter("id",id).setParameter("p",project);
        if(lock)q.setLockMode(LockModeType.PESSIMISTIC_WRITE);
        return q.getResultStream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    private void requireStatus(MedicaoFisicaEntity e,String status){if(!status.equals(e.getStatus()))throw new ResponseStatusException(HttpStatus.CONFLICT,"A medição mudou de situação. Atualize a consulta.");}
    private Long tenant(){Long t=TenantContext.getCurrentTenant();if(t==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);return t;}
    private Long user(Authentication a){return Long.valueOf(a.getName());}
    private void audit(String action,MedicaoFisicaEntity e,Authentication a){operation.audit(action,"medicao_fisica",e.getId(),user(a));}
    private void event(MedicaoFisicaEntity e,String action,String before,String after,Authentication a){
        em.createNativeQuery("insert into medicao_fisica_evento (empresa_id,medicao_id,usuario_id,acao,status_anterior,status_novo) values (:t,:m,:u,:a,:b,:d)")
            .setParameter("t",tenant()).setParameter("m",e.getId()).setParameter("u",user(a)).setParameter("a",action)
            .setParameter("b",before).setParameter("d",after).executeUpdate();
    }
    public record Request(@NotNull @Positive Long projetoObraId,@NotNull @Positive Long etapaCronogramaId,
        @NotNull LocalDate competencia,@NotBlank @Size(max=2000) String descricao,
        @NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=11,fraction=4) BigDecimal quantidade,
        @NotBlank @Pattern(regexp="m|m2|m3|un|kg|t|h") String unidade,
        @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal percentualMedido,
        @NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorMedido) {}
    public record UpdateRequest(@NotBlank @Size(max=2000) String descricao,
        @NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=11,fraction=4) BigDecimal quantidade,
        @NotBlank @Pattern(regexp="m|m2|m3|un|kg|t|h") String unidade,
        @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=2) BigDecimal percentualMedido,
        @NotNull @DecimalMin("0") @Digits(integer=13,fraction=2) BigDecimal valorMedido) {}
    public record PageResult(List<MedicaoFisicaItem> items,long total,int page,int size){}
    public record EventRecord(long id,long usuarioId,String usuario,String acao,String statusAnterior,String statusNovo,String ocorridoEm){}
    public record AttachmentRecord(long id,String nomeArquivo,String mime,long tamanho,String sha256,long usuarioId,String criadoEm){}
}
