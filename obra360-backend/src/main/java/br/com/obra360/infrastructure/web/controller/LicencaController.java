package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.LicencaService;
import br.com.obra360.infrastructure.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequiredArgsConstructor
public class LicencaController {
    private final LicencaService licenca;
    @GetMapping("/api/v1/workspace/licenca") @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Map<String,Object> usage(){return licenca.usage(TenantContext.getCurrentTenant());}
}
