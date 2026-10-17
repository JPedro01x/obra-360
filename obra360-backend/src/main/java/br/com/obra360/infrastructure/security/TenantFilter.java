package br.com.obra360.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Filter Servlet responsável por capturar o cabeçalho X-Tenant-ID ou extrair a claim do JWT
 * e armazenar o identificador da empresa no TenantContext thread-local.
 */
@Component
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String tenantHeader = request.getHeader("X-Tenant-ID");
            if (tenantHeader != null && !tenantHeader.isBlank()) {
                TenantContext.setCurrentTenant(Long.parseLong(tenantHeader));
            } else {
                // Default tenant fallback para desenvolvimento (Tenant ID 1)
                TenantContext.setCurrentTenant(1L);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
