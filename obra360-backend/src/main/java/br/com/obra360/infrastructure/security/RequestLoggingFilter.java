package br.com.obra360.infrastructure.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.extern.slf4j.Slf4j;
import java.io.IOException;
import java.util.UUID;

@Slf4j @Component
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String id=UUID.randomUUID().toString();long start=System.nanoTime();
        response.setHeader("X-Request-ID",id);MDC.put("requestId",id);
        try {chain.doFilter(request,response);} finally {
            if(request.getRequestURI().startsWith("/api/"))log.info("requestId={} method={} path={} status={} durationMs={}",id,request.getMethod(),request.getRequestURI(),response.getStatus(),(System.nanoTime()-start)/1000000);
            MDC.remove("requestId");
        }
    }
}
