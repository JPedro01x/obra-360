package br.com.obra360.infrastructure.security;

import br.com.obra360.domain.repository.UsuarioRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UsuarioRepository users;
    public JwtAuthenticationFilter(JwtService jwt, UsuarioRepository users) { this.jwt = jwt; this.users = users; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                try {
                    var user = users.findById(jwt.subject(header.substring(7))).orElse(null);
                    if (user == null || !Boolean.TRUE.equals(user.getAtivo()) || jwt.credentialVersion(header.substring(7))!=user.getVersaoCredencial() || !jwt.sessionActive(header.substring(7),user) ||
                        (user.getBloqueadoAte() != null && user.getBloqueadoAte().isAfter(java.time.OffsetDateTime.now()))) {
                        response.sendError(401); return;
                    }
                    var authentication = new UsernamePasswordAuthenticationToken(user.getId(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getPerfil())));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    TenantContext.setCurrentTenant(user.getEmpresaId());
                    // Headers supplied by the client cannot select another organization.
                    String tenant = request.getHeader("X-Tenant-ID");
                    if (tenant != null && !tenant.equals(user.getEmpresaId().toString())) {
                        response.sendError(403); return;
                    }
                    if(user.isExigeTrocaSenha() && !java.util.Set.of("/api/v1/workspace/sessao","/api/v1/workspace/minha-senha","/api/v1/workspace/minhas-sessoes/sair").contains(request.getRequestURI())) {
                        response.setStatus(403);response.setContentType("application/json");response.setCharacterEncoding("UTF-8");response.setHeader("Cache-Control","no-store");
                        response.getWriter().write("{\"code\":\"PASSWORD_CHANGE_REQUIRED\",\"detail\":\"Troque a senha inicial para continuar.\"}");return;
                    }
                } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ex) {
                    response.sendError(401); return;
                }
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
