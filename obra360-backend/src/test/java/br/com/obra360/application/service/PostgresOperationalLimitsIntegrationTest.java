package br.com.obra360.application.service;

import br.com.obra360.infrastructure.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/** Dedicated generated schema only; no application schema or operational files are touched. */
@EnabledIfEnvironmentVariable(named="TEST_POSTGRES_URL", matches=".+")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PostgresOperationalLimitsIntegrationTest {
    private static final String SECRET="isolated-postgres-test-secret-at-least-32-bytes";
    private JdbcTemplate admin;
    private JdbcTemplate jdbc;
    private DataSourceTransactionManager manager;
    private String schema;
    @TempDir Path directory;

    @BeforeAll void migrateIsolatedSchema() throws Exception {
        String url=System.getenv("TEST_POSTGRES_URL");
        String user=System.getenv().getOrDefault("TEST_POSTGRES_USERNAME","obra360_test");
        String password=System.getenv().getOrDefault("TEST_POSTGRES_PASSWORD","");
        var adminDataSource=new DriverManagerDataSource(url,user,password);
        try(var connection=adminDataSource.getConnection()) {
            assertEquals("PostgreSQL",connection.getMetaData().getDatabaseProductName());
        }
        admin=new JdbcTemplate(adminDataSource);
        schema="limits_test_"+UUID.randomUUID().toString().replace("-","");
        admin.execute("create schema "+schema);
        var isolated=new DriverManagerDataSource(url+(url.contains("?")?"&":"?")+"currentSchema="+schema,user,password);
        jdbc=new JdbcTemplate(isolated);
        manager=new DataSourceTransactionManager(isolated);
        new ResourceDatabasePopulator(
            new ClassPathResource("db/migration/V32__shared_usage_limits.sql"),
            new ClassPathResource("db/migration/V33__tenant_storage_ledger.sql")
        ).execute(isolated);
        assertEquals(64,jdbc.queryForObject("select count(*) from usage_mutex",Integer.class));
    }

    @BeforeEach void resetOwnedTables() {
        jdbc.execute("truncate table usage_window, storage_ledger, storage_usage");
    }

    @AfterEach void clearContext() {TenantContext.clear();}

    @AfterAll void dropOnlyGeneratedSchema() {
        if(admin!=null && schema!=null && schema.matches("limits_test_[0-9a-f]{32}"))
            admin.execute("drop schema "+schema+" cascade");
    }

    private SharedUsageLimits limiter() {return new SharedUsageLimits(jdbc,manager,true,SECRET);}
    private TenantStorageQuota quota() {return new TenantStorageQuota(jdbc,manager,10);}
    private DocumentStorage storage(TenantStorageQuota quota) {
        var storage=new DocumentStorage(directory.toString());
        ReflectionTestUtils.setField(storage,"tenantQuota",quota);
        return storage;
    }

    @Test void concurrentClientsShareAllowanceAndCannotReopenPreviousMinute() throws Exception {
        var first=limiter();var second=limiter();
        var pool=Executors.newFixedThreadPool(12);var start=new CountDownLatch(1);
        try {
            List<Future<Boolean>> results=new ArrayList<>();
            for(int i=0;i<80;i++) {
                var client=i%2==0?first:second;
                results.add(pool.submit(()->{start.await();return client.allow("http","192.0.2.13",17,60000);}));
            }
            start.countDown();int admitted=0;
            for(var result:results)if(result.get(20,TimeUnit.SECONDS))admitted++;
            assertEquals(17,admitted);
            assertEquals(17,jdbc.queryForObject("select hits from usage_window",Integer.class));
            assertTrue(second.allow("http","192.0.2.13",1,120000));
            assertFalse(first.allow("http","192.0.2.13",1,119999));
            assertTrue(first.allow("ai","192.0.2.13",1,120000));
            assertTrue(first.allow("http","192.0.2.14",1,120000));
            assertTrue(jdbc.queryForList("select bucket_key from usage_window",String.class)
                .stream().allMatch(key->key.matches("[0-9a-f]{64}")));
        } finally {pool.shutdownNow();}
    }

    @Test void concurrentQuotaReservationsCannotOverflowAndOtherCompanyRemainsIndependent() throws Exception {
        var first=quota();var second=quota();var pool=Executors.newFixedThreadPool(10);
        try {
            List<Callable<Boolean>> calls=new ArrayList<>();
            for(int i=0;i<30;i++) {
                var client=i%2==0?first:second;String key=UUID.randomUUID().toString();
                calls.add(()->{try{client.reserve(key,1L,2);return true;}catch(ResponseStatusException ex){assertEquals(507,ex.getStatusCode().value());return false;}});
            }
            int admitted=0;for(var result:pool.invokeAll(calls))if(result.get())admitted++;
            assertEquals(5,admitted);
            assertEquals(10,jdbc.queryForObject("select used_bytes from storage_usage where tenant_id=1",Long.class));
            second.reserve("other-company",2L,10);
            assertEquals(10,jdbc.queryForObject("select used_bytes from storage_usage where tenant_id=2",Long.class));
            String key=jdbc.queryForObject("select file_key from storage_ledger where tenant_id=1 order by file_key limit 1",String.class);
            first.release(key);second.release(key);second.reserve("replacement",1L,2);
            assertEquals(10,jdbc.queryForObject("select used_bytes from storage_usage where tenant_id=1",Long.class));
        } finally {pool.shutdownNow();}
    }

    @Test void rollbackAndDeletionPreserveLedgerAndPrivateFileOwnership() throws Exception {
        var storage=storage(quota());TenantContext.setCurrentTenant(1L);
        new TransactionTemplate(manager).executeWithoutResult(status->{
            try{storage.put(new byte[10]);}catch(Exception ex){throw new RuntimeException(ex);}
            status.setRollbackOnly();
        });
        assertEquals(0,jdbc.queryForObject("select count(*) from storage_ledger",Integer.class));
        try(var files=Files.list(directory)){assertEquals(0,files.count());}
        String reference=storage.putRh(new byte[10]);
        TenantContext.setCurrentTenant(2L);
        assertEquals(404,assertThrows(ResponseStatusException.class,()->storage.readRh(reference)).getStatusCode().value());
        assertEquals(404,assertThrows(ResponseStatusException.class,()->storage.deleteRh("rh:"+reference.substring(3).toUpperCase(Locale.ROOT))).getStatusCode().value());
        TenantContext.setCurrentTenant(1L);
        new TransactionTemplate(manager).executeWithoutResult(status->{
            try{storage.deleteRh(reference);}catch(Exception ex){throw new RuntimeException(ex);}
            status.setRollbackOnly();
        });
        assertEquals(10,storage.readRh(reference).length);
        new TransactionTemplate(manager).executeWithoutResult(status->{
            try{storage.deleteRh(reference);}catch(Exception ex){throw new RuntimeException(ex);}
        });
        assertEquals(0,jdbc.queryForObject("select used_bytes from storage_usage where tenant_id=1",Long.class));
        assertThrows(NoSuchFileException.class,()->storage.readRh(reference));
    }

    @Test void boundedExpiryAndDatabaseFailureAreVerifiedOnPostgres() {
        var limits=limiter();
        List<Object[]> expired=new ArrayList<>();
        for(int i=0;i<150;i++)expired.add(new Object[]{String.format("%064d",i),0,0,1});
        jdbc.batchUpdate("insert into usage_window(bucket_key,stripe,starts_at,hits) values(?,?,?,?)",expired);
        limits.cleanupExpired(600000);
        assertEquals(22,jdbc.queryForObject("select count(*) from usage_window",Integer.class));
        limits.cleanupExpired(600000);
        assertEquals(0,jdbc.queryForObject("select count(*) from usage_window",Integer.class));
        jdbc.execute("alter table usage_window rename to unavailable_window");
        try {
            assertEquals(503,assertThrows(ResponseStatusException.class,
                ()->limits.allow("http","192.0.2.13",1,60000)).getStatusCode().value());
        } finally {jdbc.execute("alter table unavailable_window rename to usage_window");}
    }
}
