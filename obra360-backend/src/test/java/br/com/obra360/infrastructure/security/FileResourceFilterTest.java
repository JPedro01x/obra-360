package br.com.obra360.infrastructure.security;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

class FileResourceFilterTest {
    @Test void downloadsHaveBoundedConcurrencyAndReleaseSlotsAfterCompletion() throws Exception {
        var filter=new FileResourceFilter();var entered=new CountDownLatch(4);var release=new CountDownLatch(1);
        var executor=Executors.newFixedThreadPool(4);List<Future<Integer>> running=new ArrayList<>();
        try {
            for(int i=0;i<4;i++) running.add(executor.submit(()->{
                var request=new MockHttpServletRequest("GET","/api/v1/workspace/documentos/1/arquivo");var response=new MockHttpServletResponse();
                filter.doFilter(request,response,(req,res)->{entered.countDown();try{release.await(10,TimeUnit.SECONDS);}catch(InterruptedException e){Thread.currentThread().interrupt();}});return response.getStatus();
            }));
            assertTrue(entered.await(10,TimeUnit.SECONDS));
            var blocked=new MockHttpServletResponse();filter.doFilter(new MockHttpServletRequest("GET","/api/v1/workspace/documentos/2/arquivo"),blocked,(req,res)->fail("A quinta transferência deve aguardar nova tentativa."));
            assertEquals(503,blocked.getStatus());assertEquals("2",blocked.getHeader("Retry-After"));
            var regular=new MockHttpServletResponse();filter.doFilter(new MockHttpServletRequest("GET","/api/v1/workspace/sessao"),regular,(req,res)->{});assertEquals(200,regular.getStatus());
            release.countDown();for(var result:running) assertEquals(200,result.get(10,TimeUnit.SECONDS));
            var next=new MockHttpServletResponse();filter.doFilter(new MockHttpServletRequest("GET","/api/v1/workspace/documentos/3/arquivo"),next,(req,res)->{});assertEquals(200,next.getStatus());
        } finally {release.countDown();executor.shutdownNow();}
    }
}
