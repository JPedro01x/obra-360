package br.com.obra360.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/** Relational fixed windows. Dedicated short transactions keep counters outside business rollbacks. */
@Service
public class SharedUsageLimits {
 private final JdbcTemplate jdbc; private final TransactionTemplate tx; private final boolean enabled; private final byte[] secret;
 public SharedUsageLimits(JdbcTemplate jdbc, PlatformTransactionManager manager,
   @Value("${obra360.limits.shared-enabled:false}") boolean enabled,
   @Value("${obra360.limits.key-secret:}") String secret){
  this.jdbc=jdbc;this.enabled=enabled;this.secret=secret.getBytes(StandardCharsets.UTF_8);
  if(enabled && this.secret.length<32)throw new IllegalArgumentException("Shared limits require a key-secret of at least 32 bytes.");
  tx=new TransactionTemplate(manager);tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);tx.setTimeout(5);
 }
 public boolean enabled(){return enabled;}
 public boolean allow(String scope,String identity,int limit){return allow(scope,identity,limit,System.currentTimeMillis());}
 boolean allow(String scope,String identity,int limit,long now){
  if(limit<1 || identity==null)throw new IllegalArgumentException("Invalid request limit.");
  String key=digest(scope+"\u0000"+identity);long window=Math.floorDiv(now,60000)*60000;
  try{return Boolean.TRUE.equals(tx.execute(status->{
   int stripe=Integer.parseInt(key.substring(0,2),16)%64;
   jdbc.queryForObject("select id from usage_mutex where id=? for update",Integer.class,stripe);
   // At most 128 expired keys per call, including after a restart. No raw identities persist.
   deleteExpired(stripe,window-120000);
   var rows=jdbc.query("select starts_at,hits from usage_window where bucket_key=?",(rs,n)->new long[]{rs.getLong(1),rs.getInt(2)},key);
   if(rows.isEmpty()){
    // A per-stripe bound avoids an unbounded identity cache without a global hot lock.
    int size=jdbc.queryForObject("select count(*) from usage_window where stripe=?",Integer.class,stripe);
    if(size>=2048)return false;
    jdbc.update("insert into usage_window(bucket_key,stripe,starts_at,hits) values(?,?,?,1)",key,stripe,window);return true;
   }
   var row=rows.getFirst();if(row[0]<window){jdbc.update("update usage_window set starts_at=?,hits=1 where bucket_key=?",window,key);return true;}
   if(row[1]>=limit)return false;
   jdbc.update("update usage_window set hits=hits+1 where bucket_key=?",key);return true;
  }));}catch(Exception ex){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Controle de uso temporariamente indisponível.");}
 }
 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=60000)
 public void cleanupExpired(){if(enabled)cleanupExpired(System.currentTimeMillis());}
 void cleanupExpired(long now){
  for(int stripe=0;stripe<64;stripe++){
   final int bucket=stripe;
   try{tx.executeWithoutResult(status->{
    jdbc.queryForObject("select id from usage_mutex where id=? for update",Integer.class,bucket);
    deleteExpired(bucket,now-120000);
   });}catch(RuntimeException ex){org.slf4j.LoggerFactory.getLogger(SharedUsageLimits.class).warn("Shared usage cleanup unavailable; request admission remains fail closed.");return;}
  }
 }
 private void deleteExpired(int stripe,long before){
  var keys=jdbc.query("select bucket_key from usage_window where stripe=? and starts_at<? order by starts_at,bucket_key limit 128",(rs,n)->new Object[]{rs.getString(1)},stripe,before);
  if(!keys.isEmpty())jdbc.batchUpdate("delete from usage_window where bucket_key=?",keys);
 }
 private String digest(String value){try{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret.length==0?new byte[32]:secret,"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));}catch(java.security.GeneralSecurityException ex){throw new IllegalStateException("HMAC unavailable");}}
}
