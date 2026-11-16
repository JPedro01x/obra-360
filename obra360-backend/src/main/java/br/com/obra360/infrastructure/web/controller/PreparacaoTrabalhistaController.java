package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.OperacaoService;
import br.com.obra360.domain.entity.RhFolhaEntity;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Accounting handoff only. No legal calculations, signing, or government transmission. */
@RestController @RequestMapping("/api/v1/workspace/rh/trabalhista") @PreAuthorize("hasAnyRole('SUPER_ADMIN','RH')")
public class PreparacaoTrabalhistaController {
 private final EntityManager em;private final OperacaoService op;
 public PreparacaoTrabalhistaController(EntityManager em,OperacaoService op){this.em=em;this.op=op;}
 @GetMapping("/preparacao") @Transactional(readOnly=true)
 public Map<String,Object> status(){
  var count=em.createQuery("select count(f) from RhFuncionarioEntity f where f.empresaId=:t and f.situacao<>'DESLIGADO'",Long.class).setParameter("t",TenantContext.getCurrentTenant()).getSingleResult();
  return Map.of("calculosLegaisAtivos",false,"envioEsocialAtivo",false,"funcionariosAtivos",count,"preRequisitos",List.of("Responsável contábil e convenção coletiva definidos","Tabelas e incidências da competência validadas pelo contador","Certificado digital e procurações configurados no ambiente privado","Homologação do leiaute, assinatura e retorno dos eventos"),"observacao","A folha atual registra lançamentos administrativos. A exportação é um arquivo de conferência para a contabilidade; não é um evento oficial do eSocial.");
 }
 @PostMapping("/exportar-folha") @Transactional
 public ResponseEntity<byte[]> export(@Valid @RequestBody Export r,Authentication a){
  var h=em.find(RhFolhaEntity.class,r.folhaId());
  if(h==null||!TenantContext.getCurrentTenant().equals(h.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  if(!Set.of("FECHADA","PAGA").contains(h.getSituacao()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Feche e confira a folha antes de exportar para a contabilidade.");
  var rows=em.createQuery("select f.matricula,f.nome,h.competencia,e.codigo,e.descricao,e.natureza,e.valor from RhLancamentoEntity e join RhFuncionarioEntity f on f.id=e.funcionarioId and f.empresaId=e.empresaId join RhFolhaEntity h on h.id=e.folhaId and h.empresaId=e.empresaId where e.empresaId=:t and h.id=:id order by f.matricula,e.id",Object[].class).setParameter("t",TenantContext.getCurrentTenant()).setParameter("id",h.getId()).setMaxResults(10001).getResultList();
  if(rows.size()>10000)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"Acima de 10 mil lançamentos, solicite exportação assistida.");
  var csv=new StringBuilder("\uFEFFmatricula;nome;competencia;codigo;descricao;natureza;valor\r\n");
  for(var row:rows){for(int i=0;i<row.length;i++){if(i>0)csv.append(';');String value=Objects.toString(row[i],"");String stripped=value.stripLeading();if(i<6&&!stripped.isEmpty()&&"=+-@".indexOf(stripped.charAt(0))>=0)value="'"+value;csv.append('"').append(value.replace("\"","\"\"")).append('"');}csv.append("\r\n");}
  op.audit("RH_EXPORTAR_CONTABILIDADE","rh_folha",h.getId(),Long.valueOf(a.getName()));
  return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=folha-contabilidade-"+h.getId()+".csv").header(HttpHeaders.CACHE_CONTROL,"no-store").contentType(new MediaType("text","csv",StandardCharsets.UTF_8)).body(csv.toString().getBytes(StandardCharsets.UTF_8));
 }
 public record Export(@NotNull @Positive Long folhaId,@NotBlank @Pattern(regexp="EXPORTAR") String confirmacao){}
}
