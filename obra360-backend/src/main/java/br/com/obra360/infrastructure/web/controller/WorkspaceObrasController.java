package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.application.model.ObraCatalogoPage;
import br.com.obra360.application.usecase.ListObrasPorEmpresa;
import br.com.obra360.infrastructure.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','ARQUITETO','MESTRE_OBRA','ALMOXARIFE','FINANCEIRO','AUDITOR','INCORPORADOR')")
public class WorkspaceObrasController {
    private final ListObrasPorEmpresa listObras;

    @GetMapping("/registros/projetos")
    public Map<String, Object> listar(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "25") int size) {
        if (page < 0 || page > 1_000_000 || size < 1 || size > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        ObraCatalogoPage result = listObras.execute(TenantContext.getCurrentTenant(), page, size);
        return Map.of("items", result.items(), "total", result.total(), "page", result.page(), "size", result.size());
    }
}
