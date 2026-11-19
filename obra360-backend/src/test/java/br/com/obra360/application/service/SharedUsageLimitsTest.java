package br.com.obra360.application.service;

import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import java.time.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

class SharedUsageLimitsTest {
 JdbcTemplate jdbc; SharedUsageLimits limits;
 @BeforeEach void setup(){var ds=new DriverManagerDataSource("jdbc:h2:mem:"+java.util.UUID.randomUUID()+";DB_CLOSE_DELAY=-1","sa","");jdbc=new JdbcTemplate(ds);new org.springframework.jdbc.datasource.init.ResourceDatabasePopulator(new org.springframework.core.io.ClassPathResource("db/migration/V32__shared_usage_limits.sql")).execute(ds);limits=new SharedUsageLimits(jdbc,new DataSourceTransactionManager(ds),true,"test-secret-with-more-than-32-characters");}
 @Test void concurrentInstancesRespectLimitAndBoundary() throws Exception {var second=new SharedUsageLimits(jdbc,new DataSourceTransactionManager(jdbc.getDataSource()),true,"test-secret-with-more-than-32-characters");var pool=Executors.newFixedThreadPool(8);try{var tasks=new java.util.ArrayList<Callable<Boolean>>();for(int i=0;i<60;i++){final int n=i;tasks.add(()->(n%2==0?limits:second).allow("http","192.0.2.1",10,60000));}int allowed=0;for(var result:pool.invokeAll(tasks))if(result.get())allowed++;assertEquals(10,allowed);assertTrue(limits.allow("http","192.0.2.1",10,120000));assertEquals(1,jdbc.queryForObject("select count(*) from usage_window",Integer.class));assertFalse(jdbc.queryForObject("select bucket_key from usage_window",String.class).contains("192.0.2"));}finally{pool.shutdownNow();}}
 @Test void cleanupIsBoundedAndPreservesCurrentWindows(){for(int i=0;i<150;i++)jdbc.update("insert into usage_window values(?,?,?,?)",String.format("%064d",i),0,0,1);assertTrue(limits.allow("ai","active",1,600000));limits.cleanupExpired(600000);assertEquals(23,jdbc.queryForObject("select count(*) from usage_window",Integer.class));limits.cleanupExpired(600000);assertEquals(1,jdbc.queryForObject("select count(*) from usage_window",Integer.class));}
 @Test void clockSkewCannotReopenAnEarlierWindow(){assertTrue(limits.allow("http","clock",1,60000));assertTrue(limits.allow("http","clock",1,120000));assertFalse(limits.allow("http","clock",1,119999));}
 @Test void saturatedStripeRejectsNewIdentityWithoutGrowingTable(){assertTrue(limits.allow("http","new-key",1,60000));int stripe=jdbc.queryForObject("select stripe from usage_window",Integer.class);jdbc.update("delete from usage_window");var rows=new java.util.ArrayList<Object[]>();for(int i=0;i<2048;i++)rows.add(new Object[]{String.format("%064d",i),stripe,60000,1});jdbc.batchUpdate("insert into usage_window values(?,?,?,?)",rows);assertFalse(limits.allow("http","new-key",1,60000));assertEquals(2048,jdbc.queryForObject("select count(*) from usage_window",Integer.class));}
 @Test void sharedModeRequiresStrongSecret(){assertThrows(IllegalArgumentException.class,()->new SharedUsageLimits(jdbc,new DataSourceTransactionManager(jdbc.getDataSource()),true,"short"));}
 @Test void databaseFailureDoesNotAllowRequest(){jdbc.execute("drop table usage_window");assertThrows(org.springframework.web.server.ResponseStatusException.class,()->limits.allow("ai","1",5,60000));}
 @Test void scopeAndIdentityAreSeparate(){assertTrue(limits.allow("http","1",1,60000));assertFalse(limits.allow("http","1",1,60000));assertTrue(limits.allow("ai","1",1,60000));assertTrue(limits.allow("http","2",1,60000));}
}
