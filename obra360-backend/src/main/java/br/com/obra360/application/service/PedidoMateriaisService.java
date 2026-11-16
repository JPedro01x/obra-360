package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import jakarta.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.*;
import java.time.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service @Transactional
public class PedidoMateriaisService {
 private final EntityManager em;private final OperacaoService op;private final FinanceiroObraService finance;private final PlanningDates dates;private final ObjectMapper json;
 public PedidoMateriaisService(EntityManager em,OperacaoService op,FinanceiroObraService finance,PlanningDates dates,ObjectMapper json){this.em=em;this.op=op;this.finance=finance;this.dates=dates;this.json=json;}
 public record Line(Long itemEstoqueId,BigDecimal quantidade,BigDecimal valorUnitario){}
 public record Quantity(Long itemId,BigDecimal quantidade){}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 public PedidoMateriaisEntity create(Long project,Long supplier,String reason,String proposal,LocalDate due,List<Line> lines,Long actor){
  op.project(project);dates.newPeriod(due,due);
  var f=em.find(FornecedorB2BEntity.class,supplier,LockModeType.PESSIMISTIC_WRITE);if(f==null||!finance.tenant().equals(f.getEmpresaId()))throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  if(lines==null||lines.isEmpty()||lines.size()>100)throw bad("Informe entre 1 e 100 materiais.");
  var ids=new HashSet<Long>();BigDecimal total=BigDecimal.ZERO;
  for(var l:lines){quantity(l.quantidade());finance.money(l.valorUnitario());if(l.valorUnitario().compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Preço unitário excede o limite.");if(!ids.add(l.itemEstoqueId()))throw bad("Material repetido no pedido.");
   var item=op.stock(l.itemEstoqueId(),false);if(!project.equals(item.getProjetoObraId()))throw bad("Todos os materiais devem pertencer à obra do pedido.");BigDecimal value=l.quantidade().multiply(l.valorUnitario()).setScale(2,RoundingMode.HALF_UP);finance.money(value);total=total.add(value);
  }
  finance.money(total);var p=finance.init(new PedidoMateriaisEntity(),project);p.setFornecedorB2bId(supplier);p.setJustificativa(reason.trim());p.setReferenciaProposta(proposal.trim());p.setVencimento(due);p.setTotal(total);p.setSituacao("APROVACAO");em.persist(p);
  for(var l:lines){var item=finance.init(new ItemPedidoMateriaisEntity(),project);item.setPedidoId(p.getId());item.setItemEstoqueId(l.itemEstoqueId());item.setQuantidade(l.quantidade());item.setValorUnitario(l.valorUnitario());item.setRecebida(BigDecimal.ZERO);item.setDevolvida(BigDecimal.ZERO);em.persist(item);}
  op.audit("CRIAR_PEDIDO_MULTIPLO","pedido_materiais",p.getId(),actor);return p;
 }
 private void quantity(BigDecimal q){if(q==null||q.signum()<=0||q.scale()>4||q.compareTo(new BigDecimal("99999999.9999"))>0)throw bad("Quantidade inválida; utilize até quatro casas decimais.");}
 public PedidoMateriaisEntity approve(Long id,long version,String level,Long actor){
  var p=finance.own(PedidoMateriaisEntity.class,id,true);finance.version(p,version);if(!p.getSituacao().equals("APROVACAO"))throw finance.conflict("Pedido não está em aprovação.");
  var u=op.member(actor);boolean allowed=level.equals("GESTAO")?Set.of("SUPER_ADMIN","GERENTE_OBRA","INCORPORADOR").contains(u.getPerfil()):level.equals("FINANCEIRO")&&Set.of("SUPER_ADMIN","FINANCEIRO").contains(u.getPerfil());
  if(!allowed)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  if(actor.equals(p.getAprovadorGestaoId())||actor.equals(p.getAprovadorFinanceiroId()))throw finance.conflict("São necessárias duas pessoas distintas para aprovar.");
  if(level.equals("GESTAO")){if(p.getAprovadorGestaoId()!=null)throw finance.conflict("Gestão já aprovou.");p.setAprovadorGestaoId(actor);}else{if(p.getAprovadorFinanceiroId()!=null)throw finance.conflict("Financeiro já aprovou.");p.setAprovadorFinanceiroId(actor);}
  if(p.getAprovadorGestaoId()!=null&&p.getAprovadorFinanceiroId()!=null)p.setSituacao("APROVADO");op.audit("APROVAR_PEDIDO_"+level,"pedido_materiais",id,actor);return p;
 }
 public PedidoMateriaisEntity issue(Long id,long version,Long actor){
  var p=finance.own(PedidoMateriaisEntity.class,id,true);finance.version(p,version);if(!p.getSituacao().equals("APROVADO"))throw finance.conflict("Emissão exige as duas aprovações.");
  var f=em.find(FornecedorB2BEntity.class,p.getFornecedorB2bId());var title=finance.title(p.getProjetoObraId(),"PAGAR","MATERIAIS","Pedido de materiais #"+id,f.getRazaoSocial(),p.getTotal(),p.getVencimento(),"PEDIDO:"+id,actor);
  p.setTituloId(title.getId());p.setSituacao("PEDIDO");op.audit("EMITIR_PEDIDO_MULTIPLO","pedido_materiais",id,actor);return p;
 }
 @Transactional(readOnly=true) public Map<String,Object> details(Long id){
  var p=finance.own(PedidoMateriaisEntity.class,id,false);
  var items=em.createQuery("select i.id,i.itemEstoqueId,s.nome,s.unidadeMedida,i.quantidade,i.valorUnitario,i.recebida,i.devolvida from ItemPedidoMateriaisEntity i join ItemEstoqueEntity s on s.id=i.itemEstoqueId and s.empresaId=i.empresaId where i.empresaId=:t and i.pedidoId=:id order by i.id",Object[].class).setParameter("t",finance.tenant()).setParameter("id",id).getResultList();
  var f=em.find(FornecedorB2BEntity.class,p.getFornecedorB2bId());return Map.of("pedido",p,"fornecedor",f.getRazaoSocial(),"itens",items,"eventos",em.createQuery("select e from EventoPedidoEntity e where e.empresaId=:t and e.pedidoId=:id order by e.id desc",EventoPedidoEntity.class).setParameter("t",finance.tenant()).setParameter("id",id).setMaxResults(50).getResultList());
 }
 public EventoPedidoEntity movement(Long id,long version,String type,List<Quantity> quantities,String note,String key,Long actor){
  UUID.fromString(key);var p=finance.own(PedidoMateriaisEntity.class,id,true);
  if(quantities==null||quantities.isEmpty()||quantities.size()>100)throw bad("Informe de 1 a 100 itens.");
  var sorted=quantities.stream().sorted(Comparator.comparing(Quantity::itemId)).toList();String serialized;String signature;
  try{serialized=json.writeValueAsString(sorted);signature=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((type+"|"+id+"|"+note.trim()+"|"+serialized).getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}
  var old=em.createQuery("select e from EventoPedidoEntity e where e.empresaId=:t and e.chave=:key",EventoPedidoEntity.class).setParameter("t",finance.tenant()).setParameter("key",key).getResultList();
  if(!old.isEmpty()){var event=old.get(0);if(!event.getAssinatura().equals(signature)||!actor.equals(event.getOperadorId()))throw finance.conflict("Chave já utilizada com outros dados.");return event;}
  finance.version(p,version);
  if(!Set.of("PEDIDO","PARCIAL","RECEBIDO","DEVOLUCAO").contains(p.getSituacao()))throw finance.conflict("Situação do pedido não permite movimentação.");
  var ids=new HashSet<Long>();BigDecimal credit=BigDecimal.ZERO;
  for(var q:sorted){quantity(q.quantidade());if(!ids.add(q.itemId()))throw bad("Item repetido.");var line=finance.own(ItemPedidoMateriaisEntity.class,q.itemId(),true);if(!id.equals(line.getPedidoId()))throw bad("Item não pertence a este pedido.");
   var stock=op.stock(line.getItemEstoqueId(),true);String movementKey=UUID.nameUUIDFromBytes((key+":"+line.getId()).getBytes(StandardCharsets.UTF_8)).toString();
   if(type.equals("RECEBER")){
    if(line.getRecebida().add(q.quantidade()).compareTo(line.getQuantidade())>0)throw finance.conflict("Quantidade recebida excede o saldo do item.");
    var after=line.getRecebida().add(q.quantidade());BigDecimal value=after.multiply(line.getValorUnitario()).setScale(2,RoundingMode.HALF_UP).subtract(line.getRecebida().multiply(line.getValorUnitario()).setScale(2,RoundingMode.HALF_UP));finance.money(value);
    BigDecimal average=stock.getQuantidadeAtual().multiply(stock.getCustoUnitarioMedio()).add(value).divide(stock.getQuantidadeAtual().add(q.quantidade()),2,RoundingMode.HALF_UP);
    if(average.compareTo(new BigDecimal("9999999999.99"))>0)throw finance.conflict("Custo médio excede o limite.");op.purchaseReceipt(stock.getId(),q.quantidade(),value,movementKey,actor);stock.setCustoUnitarioMedio(average);line.setRecebida(after);
   }else{
    if(line.getDevolvida().add(q.quantidade()).compareTo(line.getRecebida())>0)throw finance.conflict("Devolução excede a quantidade recebida ainda não devolvida.");
    op.movement(stock.getId(),"SAIDA",q.quantidade(),null,movementKey,actor);
    var after=line.getDevolvida().add(q.quantidade());credit=credit.add(after.multiply(line.getValorUnitario()).setScale(2,RoundingMode.HALF_UP).subtract(line.getDevolvida().multiply(line.getValorUnitario()).setScale(2,RoundingMode.HALF_UP)));line.setDevolvida(after);
   }
  }
  var event=finance.init(new EventoPedidoEntity(),p.getProjetoObraId());event.setPedidoId(id);event.setTipo(type);event.setChave(key);event.setAssinatura(signature);event.setOperadorId(actor);event.setObservacao(note.trim());event.setItens(serialized);em.persist(event);
  if(type.equals("DEVOLVER")){finance.money(credit);var f=em.find(FornecedorB2BEntity.class,p.getFornecedorB2bId());var title=finance.title(p.getProjetoObraId(),"RECEBER","CREDITO_FORNECEDOR","Crédito por devolução do pedido #"+id,f.getRazaoSocial(),credit,LocalDate.now(ZoneId.of("America/Sao_Paulo")),"DEVOLUCAO:"+event.getId(),actor);event.setCreditoId(title.getId());}
  em.flush();var all=em.createQuery("select i from ItemPedidoMateriaisEntity i where i.empresaId=:t and i.pedidoId=:id",ItemPedidoMateriaisEntity.class).setParameter("t",finance.tenant()).setParameter("id",id).getResultList();
  p.setSituacao(all.stream().anyMatch(l->l.getDevolvida().signum()>0)?"DEVOLUCAO":all.stream().allMatch(l->l.getRecebida().compareTo(l.getQuantidade())==0)?"RECEBIDO":"PARCIAL");
  // Ensure each event advances the order version even when its status remains PARCIAL.
  em.lock(p,LockModeType.PESSIMISTIC_FORCE_INCREMENT);op.audit(type+"_MATERIAIS","pedido_materiais",id,actor);return event;
 }
 public PedidoMateriaisEntity cancel(Long id,long version,Long actor){
  var p=finance.own(PedidoMateriaisEntity.class,id,true);finance.version(p,version);
  if(Set.of("CANCELADO","PARCIAL","RECEBIDO","DEVOLUCAO").contains(p.getSituacao()))throw finance.conflict("Pedido movimentado não pode ser cancelado; registre devolução.");
  if(p.getTituloId()!=null){var title=finance.own(TituloFinanceiroEntity.class,p.getTituloId(),true);if(title.getBaixado().signum()>0)throw finance.conflict("Estorne as baixas antes de cancelar o pedido.");title.setSituacao("CANCELADO");}
  p.setSituacao("CANCELADO");op.audit("CANCELAR_PEDIDO_MULTIPLO","pedido_materiais",id,actor);return p;
 }
}
