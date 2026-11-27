package br.com.obra360.infrastructure.realtime;

import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/** Emits refresh signals only after successful, authenticated workspace writes return. */
@Component
public class WorkspaceMutationEventFilter extends OncePerRequestFilter {
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final WorkspaceChangeStream changes;

    public WorkspaceMutationEventFilter(WorkspaceChangeStream changes) {
        this.changes = changes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase(java.util.Locale.ROOT);
        Long tenantId = TenantContext.getCurrentTenant();
        boolean publish = tenantId != null && WRITE_METHODS.contains(method) && isCompanyApiRoute(path);
        if ("PATCH".equals(method) && path.matches("/api/v1/workspace/chat/conversas/[^/]+/lidas")) publish = false;
        chain.doFilter(request, response);

        if (publish && response.getStatus() >= 200 && response.getStatus() < 300 && !request.isAsyncStarted()) {
            changes.publish(tenantId, "workspace");
        }
    }

    private boolean isCompanyApiRoute(String path) {
        return path.startsWith("/api/v1/")
                && !path.startsWith("/api/v1/auth/")
                && !path.startsWith("/api/v1/instalacao");
    }

}
