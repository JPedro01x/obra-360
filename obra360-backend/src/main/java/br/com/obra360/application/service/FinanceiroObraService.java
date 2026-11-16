package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.*;
import java.util.*;

@Service @Transactional
public class FinanceiroObraService {
 private final EntityManager em; private final OperacaoService op; private final PlanningDates dates;
 public FinanceiroObraService(EntityManager em,OperacaoService op,PlanningDates dates){this.em=em;this.op=op;this.dates=dates;}
 public Long tenant(){return Objects.requireNonNull(TenantContext.getCurrentTenant());}
 public ResponseStatusException conflict(String message){return new ResponseStatusException(HttpStatus.CONFLICT,message);}
 public void money(BigDecimal value){if(value==null||value.signum()<=0||value.scale()>2||value.compareTo(new BigDecimal("9999999999999.99"))>0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Valor monetário inválido.");}
 public <T extends RegistroGestao> T init(T e,Long project){e.setEmpresaId(tenant());e.setProjetoObraId(project);return e;}
 public <T extends RegistroGestao> T own(Class<T> type,Long id,boolean lock){
  // Resolve only the parent ID before locking: do not cache a stale version
  // while a concurrent operation is waiting for the project lock.
  var projects=em.createQuery("select e.projetoObraId from "+type.getSimpleName()+" e where e.empresaId=:t and e.id=:id",Long.class).setParameter("t",tenant()).setParameter("id",id).getResultList();
  if(projects.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  op.project(projects.get(0));
  var e=em.find(type,id,lock?LockModeType.PESSIMISTIC_WRITE:LockModeType.NONE);
  if(e==null||!tenant().equals(e.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);return e;
 }
 public void version(RegistroGestao e,long version){if(e.getVersao()!=version)throw conflict("Cadastro alterado. Atualize os dados antes de continuar.");}
 public void actualDate(LocalDate date){if(date==null||date.isAfter(LocalDate.now(ZoneId.of("America/Sao_Paulo"))))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A data efetiva não pode estar no futuro.");}
 public OrcamentoObraEntity budget(Long project,BigDecimal amount,String reason,Long actor){
  op.project(project);money(amount);var b=init(new OrcamentoObraEntity(),project);
  int revision=em.createQuery("select coalesce(max(e.revisao),0) from OrcamentoObraEntity e where e.empresaId=:t and e.projetoObraId=:p",Integer.class).setParameter("t",tenant()).setParameter("p",project).getSingleResult()+1;
  b.setRevisao(revision);b.setValorAprovado(amount);b.setJustificativa(reason.trim());b.setAutorId(actor);b.setSituacao("RASCUNHO");em.persist(b);op.audit("CRIAR_ORCAMENTO","orcamento_obra",b.getId(),actor);return b;
 }
 public OrcamentoObraEntity approveBudget(Long id,long version,Long actor){
  var b=own(OrcamentoObraEntity.class,id,true);version(b,version);if(!b.getSituacao().equals("RASCUNHO"))throw conflict("Orçamento não está em rascunho.");
  for(var old:em.createQuery("select e from OrcamentoObraEntity e where e.empresaId=:t and e.projetoObraId=:p and e.situacao='APROVADO'",OrcamentoObraEntity.class).setParameter("t",tenant()).setParameter("p",b.getProjetoObraId()).getResultList())old.setSituacao("SUBSTITUIDO");
  b.setSituacao("APROVADO");b.setAprovadorId(actor);op.audit("APROVAR_ORCAMENTO","orcamento_obra",id,actor);return b;
 }
 public TituloFinanceiroEntity title(Long project,String type,String category,String description,String counterpart,BigDecimal amount,LocalDate due,String source,Long actor){
  op.project(project);money(amount);if(source==null)dates.newPeriod(due,due);
  var t=init(new TituloFinanceiroEntity(),project);t.setTipo(type);t.setCategoria(category);t.setDescricao(description.trim());t.setContraparte(counterpart.trim());t.setValor(amount);t.setBaixado(BigDecimal.ZERO);t.setVencimento(due);t.setSituacao("ABERTO");t.setOrigem(source);em.persist(t);op.audit("CRIAR_TITULO","titulo_financeiro",t.getId(),actor);return t;
 }
 public TituloFinanceiroEntity cancel(Long id,long version,Long actor){
  var t=own(TituloFinanceiroEntity.class,id,true);version(t,version);
  if(t.getBaixado().signum()!=0||!t.getSituacao().equals("ABERTO")||t.getOrigem()!=null)throw conflict("Somente título manual aberto e sem baixas pode ser cancelado.");
  t.setSituacao("CANCELADO");op.audit("CANCELAR_TITULO","titulo_financeiro",id,actor);return t;
 }
 private void update(TituloFinanceiroEntity t){t.setSituacao(t.getBaixado().signum()==0?"ABERTO":t.getBaixado().compareTo(t.getValor())==0?"QUITADO":"PARCIAL");}
 public BaixaFinanceiraEntity settle(Long id,long version,BigDecimal amount,LocalDate date,String account,String note,String key,Long actor){
  UUID.fromString(key);money(amount);actualDate(date);var t=own(TituloFinanceiroEntity.class,id,true);
  var duplicates=em.createQuery("select e from BaixaFinanceiraEntity e where e.empresaId=:t and e.chave=:k",BaixaFinanceiraEntity.class).setParameter("t",tenant()).setParameter("k",key).getResultList();
  if(!duplicates.isEmpty()){var old=duplicates.get(0);if(!id.equals(old.getTituloId())||old.getValor().compareTo(amount)!=0||!old.getDataEfetiva().equals(date)||!old.getConta().equals(account.trim())||!old.getObservacao().equals(note.trim())||!actor.equals(old.getOperadorId())||old.getEstornoDe()!=null)throw conflict("Chave de operação já utilizada com outros dados.");return old;}
  version(t,version);if(t.getSituacao().equals("CANCELADO")||t.getBaixado().add(amount).compareTo(t.getValor())>0)throw conflict("Baixa excede o saldo ou título cancelado.");
  var b=init(new BaixaFinanceiraEntity(),t.getProjetoObraId());b.setTituloId(id);b.setChave(key);b.setValor(amount);b.setDataEfetiva(date);b.setConta(account.trim());b.setObservacao(note.trim());b.setOperadorId(actor);em.persist(b);
  t.setBaixado(t.getBaixado().add(amount));update(t);op.audit("REGISTRAR_BAIXA","titulo_financeiro",id,actor);return b;
 }
 public BaixaFinanceiraEntity reverse(Long id,long version,String reason,Long actor){
  var original=own(BaixaFinanceiraEntity.class,id,false);var t=own(TituloFinanceiroEntity.class,original.getTituloId(),true);em.lock(original,LockModeType.PESSIMISTIC_WRITE);version(original,version);
  if(original.isEstornado()||original.getEstornoDe()!=null)throw conflict("Baixa já estornada ou é um estorno.");
  if(em.createQuery("select count(e) from ExtratoBancarioEntity e where e.empresaId=:t and e.baixaId=:id",Long.class).setParameter("t",tenant()).setParameter("id",id).getSingleResult()>0)throw conflict("Desfaça a conciliação antes de estornar a baixa.");
  original.setEstornado(true);var reversal=init(new BaixaFinanceiraEntity(),original.getProjetoObraId());reversal.setTituloId(t.getId());reversal.setEstornoDe(id);reversal.setChave(UUID.randomUUID().toString());reversal.setValor(original.getValor().negate());reversal.setDataEfetiva(LocalDate.now(ZoneId.of("America/Sao_Paulo")));reversal.setConta(original.getConta());reversal.setObservacao(reason.trim());reversal.setOperadorId(actor);em.persist(reversal);
  t.setBaixado(t.getBaixado().subtract(original.getValor()));update(t);op.audit("ESTORNAR_BAIXA","baixa_financeira",id,actor);return reversal;
 }
 public ExtratoBancarioEntity bank(Long project,String account,String identifier,LocalDate date,String description,BigDecimal value,Long actor){
  op.project(project);actualDate(date);money(value.abs());
  var existing=em.createQuery("select e from ExtratoBancarioEntity e where e.empresaId=:t and e.conta=:c and e.identificador=:i",ExtratoBancarioEntity.class).setParameter("t",tenant()).setParameter("c",account.trim()).setParameter("i",identifier.trim()).getResultList();
  if(!existing.isEmpty()){var old=existing.get(0);if(!project.equals(old.getProjetoObraId())||!date.equals(old.getData())||value.compareTo(old.getValor())!=0||!description.trim().equals(old.getDescricao()))throw conflict("Identificador de extrato repetido com outros dados.");return old;}
  var e=init(new ExtratoBancarioEntity(),project);e.setConta(account.trim());e.setIdentificador(identifier.trim());e.setData(date);e.setDescricao(description.trim());e.setValor(value);em.persist(e);op.audit("IMPORTAR_EXTRATO","extrato_bancario",e.getId(),actor);return e;
 }
 public ExtratoBancarioEntity reconcile(Long id,Long payment,long version,Long actor){
  var e=own(ExtratoBancarioEntity.class,id,true);version(e,version);
  if(payment==null){if(e.getBaixaId()==null)throw conflict("Movimento não está conciliado.");e.setBaixaId(null);op.audit("DESFAZER_CONCILIACAO","extrato_bancario",id,actor);return e;}
  var b=own(BaixaFinanceiraEntity.class,payment,true);var t=own(TituloFinanceiroEntity.class,b.getTituloId(),true);
  BigDecimal signed=t.getTipo().equals("PAGAR")?b.getValor().negate():b.getValor();
  if(e.getBaixaId()!=null||b.isEstornado()||b.getEstornoDe()!=null||!e.getProjetoObraId().equals(b.getProjetoObraId())||!e.getConta().equals(b.getConta())||e.getValor().compareTo(signed)!=0)throw conflict("A baixa deve ter a mesma obra, conta, sinal e valor do extrato, e estar ativa.");
  if(em.createQuery("select count(e) from ExtratoBancarioEntity e where e.empresaId=:t and e.baixaId=:id",Long.class).setParameter("t",tenant()).setParameter("id",payment).getSingleResult()>0)throw conflict("Baixa já conciliada.");
  e.setBaixaId(payment);op.audit("CONCILIAR_EXTRATO","extrato_bancario",id,actor);return e;
 }
 @Transactional(readOnly=true) public Map<String,Object> list(String resource,Long project,int page){
  String type=switch(resource){case "orcamentos"->"OrcamentoObraEntity";case "titulos"->"TituloFinanceiroEntity";case "baixas"->"BaixaFinanceiraEntity";case "extrato"->"ExtratoBancarioEntity";case "pedidos"->"PedidoMateriaisEntity";default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);};
  if(page<0||page>100000)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);if(project!=null)op.project(project);
  String where=" from "+type+" e where e.empresaId=:t"+(project==null?"":" and e.projetoObraId=:p");
  var query=em.createQuery("select e"+where+" order by e.id desc").setParameter("t",tenant());var count=em.createQuery("select count(e)"+where,Long.class).setParameter("t",tenant());if(project!=null){query.setParameter("p",project);count.setParameter("p",project);}
  return Map.of("items",query.setFirstResult(page*25).setMaxResults(25).getResultList(),"total",count.getSingleResult(),"page",page,"size",25);
 }
 @Transactional(readOnly=true) public Map<String,Object> summary(Long project){
  op.project(project);var result=new LinkedHashMap<String,Object>();
  var budgets=em.createQuery("select b.valorAprovado from OrcamentoObraEntity b where b.empresaId=:t and b.projetoObraId=:p and b.situacao='APROVADO'",BigDecimal.class).setParameter("t",tenant()).setParameter("p",project).getResultList();
  result.put("investimentoAprovado",budgets.isEmpty()?null:budgets.get(0));
  for(String type:List.of("PAGAR","RECEBER")){
   var totals=em.createQuery("select coalesce(sum(t.valor),0),coalesce(sum(t.baixado),0) from TituloFinanceiroEntity t where t.empresaId=:t and t.projetoObraId=:p and t.tipo=:type and t.situacao<>'CANCELADO'",Object[].class).setParameter("t",tenant()).setParameter("p",project).setParameter("type",type).getSingleResult();
   result.put(type.equals("PAGAR")?"despesasComprometidas":"receitasPrevistas",totals[0]);result.put(type.equals("PAGAR")?"pagamentosRegistrados":"recebimentosRegistrados",totals[1]);result.put(type.equals("PAGAR")?"saldoPagar":"saldoReceber",((BigDecimal)totals[0]).subtract((BigDecimal)totals[1]));
  }
  var credits=em.createQuery("select coalesce(sum(t.valor),0) from TituloFinanceiroEntity t where t.empresaId=:t and t.projetoObraId=:p and t.tipo='RECEBER' and t.categoria='CREDITO_FORNECEDOR' and t.situacao<>'CANCELADO'",BigDecimal.class).setParameter("t",tenant()).setParameter("p",project).getSingleResult();
  result.put("creditosDevolucao",credits);
  var net=((BigDecimal)result.get("despesasComprometidas")).subtract(credits);result.put("despesasLiquidasComprometidas",net);
  result.put("saldoOrcamento",budgets.isEmpty()?null:budgets.get(0).subtract(net));
  result.put("observacao","Somente títulos e baixas registrados. Não soma novamente compras ou consumo de materiais e não executa transações bancárias.");return result;
 }
}
