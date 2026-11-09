package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.service.*;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/modelador") @RequiredArgsConstructor @Transactional
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','MESTRE_OBRA','AUDITOR','INCORPORADOR')")
public class ModeladorObraController {
    private final EntityManager em;
    private final OperacaoService operation;
    private final ModeloDocumentoService documents;
    private final LicencaService licenca;
    private Long tenant(){return TenantContext.getCurrentTenant();}
    private void availableName(Long projectId,String name,Long currentId){
        var project=operation.project(projectId);em.lock(project,LockModeType.PESSIMISTIC_WRITE);
        long count=em.createQuery("select count(m) from ModeloObraEntity m where m.projetoObraId=:p and m.nome=:n and m.id<>:id",Long.class)
            .setParameter("p",projectId).setParameter("n",name.trim()).setParameter("id",currentId==null?0L:currentId).getSingleResult();
        if(count>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Já existe um modelo com esse nome na obra. Escolha outro nome para salvar.");
    }
    private void page(int page,int size){if(page<0||page>100000||size<1||size>100)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Página inválida.");}
    private ModeloObraEntity own(Long id,boolean lock){var e=em.find(ModeloObraEntity.class,id,lock?LockModeType.PESSIMISTIC_WRITE:LockModeType.NONE);if(e==null||!tenant().equals(e.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);operation.project(e.getProjetoObraId());return e;}
    private void writable(ModeloObraEntity e,long version){if(e.getVersao()!=version)throw new ResponseStatusException(HttpStatus.CONFLICT,"Outra sessão salvou este modelo. Suas alterações foram preservadas na tela; recarregue ou exporte antes de continuar.");if(e.isArquivado())throw new ResponseStatusException(HttpStatus.CONFLICT,"Reative o modelo antes de editar.");}
    private Map<String,Object> summary(ModeloObraEntity e){return Map.of("id",e.getId(),"projetoObraId",e.getProjetoObraId(),"nome",e.getNome(),"arquivado",e.isArquivado(),"versao",e.getVersao(),"revisao",e.getRevisao(),"atualizadoEm",e.getAtualizadoEm());}
    private Map<String,Object> detail(ModeloObraEntity e){
        var result=new LinkedHashMap<>(summary(e));
        result.put("documento",documents.decode(e.getDocumento()));
        result.put("unidadePublicadaId",e.getUnidadePublicadaId());
        result.put("revisaoPublicada",e.getUnidadePublicadaId()==null ? null :
            Objects.requireNonNullElse(e.getRevisaoPublicada(), e.getRevisao()));
        return result;
    }
    private void revision(ModeloObraEntity model,String reason,Authentication a){
        var e=new ModeloRevisaoEntity();e.setEmpresaId(tenant());e.setModeloId(model.getId());e.setUsuarioId(Long.valueOf(a.getName()));e.setNumero(model.getRevisao());e.setNome(model.getNome());e.setMotivo(reason);e.setDocumento(model.getDocumento());em.persist(e);
        operation.audit("SALVAR_REVISAO_3D","modelo_obra",model.getId(),Long.valueOf(a.getName()));
    }
    @GetMapping("/modelos") @Transactional(readOnly=true)
    public Map<String,Object> list(@RequestParam Long projetoObraId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="25") int size,@RequestParam(defaultValue="false") boolean incluirArquivados){
        operation.project(projetoObraId);page(page,size);String where=" from ModeloObraEntity e where e.empresaId=:t and e.projetoObraId=:p"+(incluirArquivados?"":" and e.arquivado=false");
        var list=em.createQuery("select e"+where+" order by e.atualizadoEm desc,e.id desc",ModeloObraEntity.class).setParameter("t",tenant()).setParameter("p",projetoObraId).setFirstResult(page*size).setMaxResults(size).getResultList();
        long count=em.createQuery("select count(e)"+where,Long.class).setParameter("t",tenant()).setParameter("p",projetoObraId).getSingleResult();return Map.of("items",list.stream().map(this::summary).toList(),"total",count,"page",page,"size",size);
    }
    @PostMapping("/modelos") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> create(@Valid @RequestBody CreateRequest r,Authentication a){
        licenca.model(tenant());
        availableName(r.projetoObraId(),r.nome(),null);
        var project=operation.project(r.projetoObraId());em.lock(project,LockModeType.PESSIMISTIC_WRITE);
        var e=new ModeloObraEntity();e.setEmpresaId(tenant());e.setProjetoObraId(project.getId());e.setNome(r.nome().trim());e.setRevisao(1);
        e.setDocumento(documents.encode(new ModeloDocumento(1,List.of(new ModeloDocumento.Pavimento(UUID.randomUUID().toString(),"Térreo",0.0,2.8)),List.of())));em.persist(e);em.flush();revision(e,"Criação de modelo vazio",a);return detail(e);
    }
    @GetMapping("/modelos/{id}") @Transactional(readOnly=true)
    public Map<String,Object> get(@PathVariable Long id){return detail(own(id,false));}
    @PostMapping("/modelos/{id}/duplicar") @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> duplicate(@PathVariable Long id,@Valid @RequestBody CreateRequest r,Authentication a){
        licenca.model(tenant());
        var source=own(id,true);var project=operation.project(r.projetoObraId());em.lock(project,LockModeType.PESSIMISTIC_WRITE);
        availableName(r.projetoObraId(),r.nome(),null);
        var e=new ModeloObraEntity();e.setEmpresaId(tenant());e.setProjetoObraId(project.getId());e.setNome(r.nome().trim());e.setRevisao(1);e.setDocumento(documents.encode(documents.decode(source.getDocumento())));em.persist(e);em.flush();revision(e,"Cópia do modelo #"+source.getId()+", revisão "+source.getRevisao(),a);return detail(e);
    }
    @PutMapping("/modelos/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> save(@PathVariable Long id,@Valid @RequestBody SaveRequest r,Authentication a){
        var e=own(id,true);writable(e,r.versao());String document=documents.encode(r.documento());String name=r.nome().trim();
        availableName(e.getProjetoObraId(),name,e.getId());
        if (r.rascunhoToken()!=null) {
            var draft = privateDraft(id, Long.valueOf(a.getName()));
            if (draft!=null && r.rascunhoToken().equals(draft.getToken())) em.remove(draft);
        }
        if(e.getDocumento().equals(document)&&e.getNome().equals(name))return detail(e);
        e.preservarPublicacaoLegada();
        e.setDocumento(document);e.setNome(name);e.setRevisao(e.getRevisao()+1);e.setAtualizadoEm(OffsetDateTime.now());revision(e,r.motivo().trim(),a);em.flush();return detail(e);
    }

    private ModeloRascunhoEntity privateDraft(Long id, Long userId) {
        return em.createQuery("""
            select d from ModeloRascunhoEntity d
            where d.modeloId=:modelo and d.empresaId=:empresa and d.usuarioId=:usuario
            """, ModeloRascunhoEntity.class)
            .setParameter("modelo",id).setParameter("empresa",tenant()).setParameter("usuario",userId)
            .getResultList().stream().findFirst().orElse(null);
    }

    private Map<String,Object> draftView(ModeloRascunhoEntity draft) {
        return Map.of("nome",draft.getNome(),"documento",documents.decode(draft.getDocumento()),
            "versaoBase",draft.getVersaoBase(),"token",draft.getToken(),"atualizadoEm",draft.getAtualizadoEm());
    }

    private void checkDraftToken(ModeloRascunhoEntity draft, String token) {
        if (!Objects.equals(draft==null ? null : draft.getToken(),token))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "O rascunho do servidor mudou. Atualize a consulta para conferir a cópia atual.");
    }

    @GetMapping("/modelos/{id}/rascunho") @Transactional(readOnly=true)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public ResponseEntity<Map<String,Object>> getDraft(@PathVariable Long id, Authentication auth) {
        own(id,false);
        var draft = privateDraft(id,Long.valueOf(auth.getName()));
        return draft==null ? ResponseEntity.noContent().build() : ResponseEntity.ok(draftView(draft));
    }

    @PutMapping("/modelos/{id}/rascunho")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> putDraft(@PathVariable Long id, @Valid @RequestBody DraftRequest request,
            Authentication auth) {
        var model = own(id,true);
        writable(model,request.versaoBase());
        Long userId = Long.valueOf(auth.getName());
        var draft = privateDraft(id,userId);
        checkDraftToken(draft,request.token());
        String document = documents.encode(request.documento());
        boolean create = draft==null;
        if (create) {
            draft = new ModeloRascunhoEntity();
            draft.setModeloId(id);
            draft.setEmpresaId(tenant());
            draft.setUsuarioId(userId);
        }
        draft.setNome(request.nome().trim());
        draft.setDocumento(document);
        draft.setVersaoBase(request.versaoBase());
        draft.setAtualizadoEm(OffsetDateTime.now());
        draft.setToken(UUID.randomUUID().toString());
        if (create) em.persist(draft);
        return draftView(draft);
    }

    @DeleteMapping("/modelos/{id}/rascunho") @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public void deleteDraft(@PathVariable Long id, @RequestParam String token, Authentication auth) {
        own(id,true);
        var draft = privateDraft(id,Long.valueOf(auth.getName()));
        if (draft==null) return;
        checkDraftToken(draft,token);
        em.remove(draft);
    }
    @GetMapping("/modelos/{id}/revisoes") @Transactional(readOnly=true)
    public Map<String,Object> revisions(@PathVariable Long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
        own(id,false);page(page,size);String where=" from ModeloRevisaoEntity e where e.empresaId=:t and e.modeloId=:m";
        var rows=em.createQuery("select e"+where+" order by e.numero desc",ModeloRevisaoEntity.class).setParameter("t",tenant()).setParameter("m",id).setFirstResult(page*size).setMaxResults(size).getResultList();
        var items=rows.stream().map(e->Map.<String,Object>of("id",e.getId(),"numero",e.getNumero(),"nome",e.getNome(),"motivo",e.getMotivo(),"usuarioId",e.getUsuarioId(),"criadoEm",e.getCriadoEm())).toList();
        return Map.of("items",items,"total",em.createQuery("select count(e)"+where,Long.class).setParameter("t",tenant()).setParameter("m",id).getSingleResult(),"page",page,"size",size);
    }
    @PostMapping("/modelos/{id}/restaurar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> restore(@PathVariable Long id,@Valid @RequestBody RestoreRequest r,Authentication a){
        var model=own(id,true);writable(model,r.versao());var old=em.find(ModeloRevisaoEntity.class,r.revisaoId());if(old==null||!tenant().equals(old.getEmpresaId())||!id.equals(old.getModeloId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        availableName(model.getProjetoObraId(),old.getNome(),model.getId());
        model.preservarPublicacaoLegada();
        model.setDocumento(documents.encode(documents.decode(old.getDocumento())));model.setNome(old.getNome());model.setRevisao(model.getRevisao()+1);model.setAtualizadoEm(OffsetDateTime.now());revision(model,"Restauração da revisão "+old.getNumero()+": "+r.motivo().trim(),a);em.flush();return detail(model);
    }
    @GetMapping("/modelos/{id}/revisoes/{numero}") @Transactional(readOnly=true)
    public Map<String,Object> revisionFrame(@PathVariable Long id, @PathVariable int numero) {
        own(id,false);
        var frame = em.createQuery("""
            select r from ModeloRevisaoEntity r
            where r.modeloId=:modelo and r.empresaId=:empresa and r.numero=:numero
            """, ModeloRevisaoEntity.class)
            .setParameter("modelo",id).setParameter("empresa",tenant()).setParameter("numero",numero)
            .getResultList().stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("numero", frame.getNumero(), "nome", frame.getNome(), "motivo", frame.getMotivo(),
            "criadoEm", frame.getCriadoEm(), "documento", documents.decode(frame.getDocumento()));
    }

    @GetMapping("/modelos/{id}/unidades") @Transactional(readOnly=true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<Map<String,Object>> publicationUnits(@PathVariable Long id,
            @RequestParam(defaultValue="") String q) {
        var model = own(id,false);
        if (q.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        return em.createQuery("""
            select u.id, u.codigoUnidade from UnidadeImobiliariaEntity u
            where u.projetoObraId=:projeto and lower(u.codigoUnidade) like :busca
            order by u.codigoUnidade, u.id
            """, Object[].class)
            .setParameter("projeto",model.getProjetoObraId())
            .setParameter("busca","%"+q.trim().toLowerCase(Locale.ROOT)+"%")
            .setMaxResults(100).getResultList().stream()
            .map(row -> Map.<String,Object>of("id",row[0],"nome",row[1])).toList();
    }

    @PatchMapping("/modelos/{id}/publicacao")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Map<String,Object> publish(@PathVariable Long id,
            @Valid @RequestBody PublishRequest request, Authentication auth) {
        var model = own(id,true);
        if (model.getVersao()!=request.versao())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Modelo alterado. Atualize a consulta.");
        var unitId = request.unidadeId();
        Integer publishedRevision = null;
        if (unitId!=null) {
            writable(model,request.versao());
            var unit = em.find(UnidadeImobiliariaEntity.class,unitId);
            if (unit==null || !model.getProjetoObraId().equals(unit.getProjetoObraId()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selecione uma unidade da obra do modelo.");
            publishedRevision = Objects.requireNonNullElse(request.revisao(), model.getRevisao());
            long matches = em.createQuery("""
                select count(r) from ModeloRevisaoEntity r
                where r.modeloId=:modelo and r.empresaId=:empresa and r.numero=:numero
                """, Long.class)
                .setParameter("modelo",id).setParameter("empresa",tenant())
                .setParameter("numero",publishedRevision).getSingleResult();
            if (matches==0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selecione uma revisão salva deste modelo.");
        }
        if (!Objects.equals(model.getUnidadePublicadaId(),unitId) ||
            !Objects.equals(model.getRevisaoPublicada(),publishedRevision)) {
            if (unitId==null) publicationEvent(model,"OCULTADA",auth);
            model.setUnidadePublicadaId(unitId);
            model.setRevisaoPublicada(publishedRevision);
            if (unitId!=null) publicationEvent(model,"PUBLICADA",auth);
            operation.audit(unitId==null?"OCULTAR_PLANTA":"PUBLICAR_PLANTA","modelo_obra",id,
                Long.valueOf(auth.getName()));
            em.flush();
        }
        return detail(model);
    }

    private void publicationEvent(ModeloObraEntity model, String action, Authentication auth) {
        if (model.getUnidadePublicadaId()==null) return;
        Long actorId = Long.valueOf(auth.getName());
        var actor = em.find(UsuarioEntity.class,actorId);
        var unit = em.find(UnidadeImobiliariaEntity.class,model.getUnidadePublicadaId());
        var event = new ModeloPublicacaoEventoEntity();
        event.setModeloId(model.getId());
        event.setEmpresaId(tenant());
        event.setUsuarioId(actorId);
        event.setAutor(actor.getNome());
        event.setUnidadeId(model.getUnidadePublicadaId());
        event.setUnidadeCodigo(unit==null ? "Unidade #" + model.getUnidadePublicadaId() : unit.getCodigoUnidade());
        event.setRevisao(Objects.requireNonNullElse(model.getRevisaoPublicada(),model.getRevisao()));
        event.setAcao(action);
        event.setOcorridoEm(OffsetDateTime.now());
        em.persist(event);
    }

    @GetMapping("/modelos/{id}/publicacoes") @Transactional(readOnly=true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Map<String,Object> publicationHistory(@PathVariable Long id,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        own(id,false);
        page(page,size);
        String where = " from ModeloPublicacaoEventoEntity e where e.modeloId=:modelo and e.empresaId=:empresa";
        var events = em.createQuery("select e" + where + " order by e.id desc",ModeloPublicacaoEventoEntity.class)
            .setParameter("modelo",id).setParameter("empresa",tenant())
            .setFirstResult(page*size).setMaxResults(size).getResultList();
        var total = em.createQuery("select count(e)" + where,Long.class)
            .setParameter("modelo",id).setParameter("empresa",tenant()).getSingleResult();
        return Map.of("items",events,"total",total,"page",page,"size",size);
    }

    public record PublishRequest(@Min(0) long versao, @Positive Long unidadeId, @Positive Integer revisao) {}
    @PatchMapping("/modelos/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO')")
    public Map<String,Object> archive(@PathVariable Long id,@Valid @RequestBody ArchiveRequest r,Authentication a){
        var e=own(id,true);
        if(e.getVersao()!=r.versao())throw new ResponseStatusException(HttpStatus.CONFLICT,"Modelo alterado. Atualize a consulta.");
        if(e.isArquivado()!=r.arquivado()) publicationEvent(e,r.arquivado()?"ARQUIVADA":"REATIVADA",a);
        e.setArquivado(r.arquivado());e.setAtualizadoEm(OffsetDateTime.now());
        operation.audit(r.arquivado()?"ARQUIVAR_MODELO_3D":"REATIVAR_MODELO_3D","modelo_obra",id,Long.valueOf(a.getName()));
        em.flush();return detail(e);
    }
    public record CreateRequest(@NotNull Long projetoObraId,@NotBlank @Size(max=150) String nome){}
    public record SaveRequest(@Min(0) long versao,@NotBlank @Size(max=150) String nome,@NotNull @Valid ModeloDocumento documento,@NotBlank @Size(max=500) String motivo,@Size(max=36) String rascunhoToken){}
    public record DraftRequest(@Min(0) long versaoBase,@NotBlank @Size(max=150) String nome,
        @NotNull @Valid ModeloDocumento documento,@Size(max=36) String token){}
    public record RestoreRequest(@Min(0) long versao,@NotNull Long revisaoId,@NotBlank @Size(max=400) String motivo){}
    public record ArchiveRequest(@Min(0) long versao,@NotNull Boolean arquivado){}
}
