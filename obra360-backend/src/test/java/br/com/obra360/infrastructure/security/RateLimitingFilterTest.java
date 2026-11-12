package br.com.obra360.infrastructure.security;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class RateLimitingFilterTest {
    @Test void forwardedHeadersCannotEvadeLimitAndResponseHasRetryAfter() throws Exception {
        var filter=new RateLimitingFilter();ReflectionTestUtils.setField(filter,"limit",2);
        for(int i=0;i<3;i++) {
            var request=new MockHttpServletRequest();request.setRemoteAddr("192.0.2.1");request.addHeader("X-Forwarded-For","198.51.100."+i);
            var response=new MockHttpServletResponse();filter.doFilter(request,response,(req,res)->{});
            assertEquals(i<2?200:429,response.getStatus());if(i==2) assertNotNull(response.getHeader("Retry-After"));
        }
    }
    @Test void concurrentRequestsCannotExceedWindowAllowance() throws Exception {
        var filter=new RateLimitingFilter();ReflectionTestUtils.setField(filter,"limit",3);
        var allowed=new AtomicInteger();var start=new CountDownLatch(1);var executor=Executors.newFixedThreadPool(12);
        try {
            List<Future<Integer>> results=new ArrayList<>();
            for(int i=0;i<12;i++) results.add(executor.submit(()->{
                start.await();var request=new MockHttpServletRequest();request.setRemoteAddr("192.0.2.2");
                var response=new MockHttpServletResponse();filter.doFilter(request,response,(req,res)->allowed.incrementAndGet());return response.getStatus();
            }));
            start.countDown();int rejected=0;for(var result:results) if(result.get(10,TimeUnit.SECONDS)==429) rejected++;
            assertEquals(3,allowed.get());assertEquals(9,rejected);
        } finally {executor.shutdownNow();}
    }
}
