package br.com.obra360.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Accounting for newly written tenant files only. Legacy ownership is never inferred. */
@Service
public class TenantStorageQuota {
 private final JdbcTemplate jdbc;private final TransactionTemplate tx;private final long maxBytes;
 public TenantStorageQuota(JdbcTemplate jdbc,PlatformTransactionManager manager,
   @Value("${DOCUMENT_STORAGE_TENANT_MAX_BYTES:0}") long maxBytes){
  if(maxBytes<0)throw new IllegalArgumentException("Tenant quota cannot be negative.");
  this.jdbc=jdbc;this.maxBytes=maxBytes;tx=new TransactionTemplate(manager);tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);tx.setTimeout(5);
 }
 public boolean enabled(){return maxBytes>0;}
 private void lock(long tenant){jdbc.queryForObject("select id from usage_mutex where id=? for update",Integer.class,Math.floorMod(Long.hashCode(tenant),64));}
 public void reserve(String key,Long tenant,long bytes){
  if(!enabled())return;
  if(tenant==null || tenant<1)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Empresa não identificada.");
  if(bytes<0)throw new IllegalArgumentException("Negative file length.");
  run(()->{lock(tenant);var usage=jdbc.query("select used_bytes,limit_bytes from storage_usage where tenant_id=?",(rs,n)->new long[]{rs.getLong(1),rs.getObject(2)==null?maxBytes:rs.getLong(2)},tenant);
   long used=usage.isEmpty()?0:usage.getFirst()[0];long budget=usage.isEmpty()?maxBytes:usage.getFirst()[1];
   if(bytes>budget-used)throw new ResponseStatusException(HttpStatus.INSUFFICIENT_STORAGE,"Limite de armazenamento da empresa atingido.");
   if(usage.isEmpty())jdbc.update("insert into storage_usage(tenant_id,used_bytes) values(?,?)",tenant,bytes);
   else jdbc.update("update storage_usage set used_bytes=used_bytes+? where tenant_id=?",bytes,tenant);
   jdbc.update("insert into storage_ledger(file_key,tenant_id,size_bytes) values(?,?,?)",key,tenant,bytes);
  });
 }
 /** Returns tracked owner, or null for a historical unaccounted file. */
 public Long owner(String key){
  if(!enabled())return null;
  try{var result=jdbc.query("select tenant_id from storage_ledger where file_key=?",(rs,n)->rs.getLong(1),key);return result.isEmpty()?null:result.getFirst();}
  catch(Exception ex){throw unavailable();}
 }
 public void authorize(String key,Long tenant){Long owner=owner(key);if(owner!=null && !owner.equals(tenant))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Arquivo indisponível.");}
 public void release(String key){if(!enabled())return;run(()->{var rows=jdbc.query("select tenant_id,size_bytes from storage_ledger where file_key=?",(rs,n)->new long[]{rs.getLong(1),rs.getLong(2)},key);if(rows.isEmpty())return;long tenant=rows.getFirst()[0];lock(tenant);var current=jdbc.query("select size_bytes from storage_ledger where file_key=?",(rs,n)->rs.getLong(1),key);if(current.isEmpty())return;jdbc.update("delete from storage_ledger where file_key=?",key);jdbc.update("update storage_usage set used_bytes=used_bytes-? where tenant_id=?",current.getFirst(),tenant);});}
 private void run(Runnable action){try{tx.executeWithoutResult(status->action.run());}catch(ResponseStatusException ex){throw ex;}catch(Exception ex){throw unavailable();}}
 private ResponseStatusException unavailable(){return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Controle de armazenamento temporariamente indisponível.");}
}
