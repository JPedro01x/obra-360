package br.com.obra360.infrastructure.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.concurrent.Semaphore;

/** Keeps bounded-memory file responses in flight until response serialization finishes. */
@Component
public class FileResourceFilter extends OncePerRequestFilter {
    private final Semaphore downloads=new Semaphore(4);
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)
            throws ServletException,IOException {
        String path=request.getRequestURI();
        boolean binary=path.startsWith("/api/v1/workspace/") && (path.endsWith("/arquivo") || path.endsWith("/referencia") || path.endsWith("/exportar"));
        if(!binary) {chain.doFilter(request,response);return;}
        if(!downloads.tryAcquire()) {
            response.setStatus(503);response.setCharacterEncoding("UTF-8");response.setContentType("application/problem+json");
            response.setHeader("Retry-After","2");response.setHeader("Cache-Control","no-store");
            response.getWriter().write("{\"status\":503,\"detail\":\"Transferência de arquivos ocupada. Tente novamente em instantes.\"}");return;
        }
        try {chain.doFilter(request,response);} finally {downloads.release();}
    }
}
