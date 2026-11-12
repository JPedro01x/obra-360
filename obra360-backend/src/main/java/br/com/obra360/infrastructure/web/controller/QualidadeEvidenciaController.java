package br.com.obra360.infrastructure.web.controller;
import br.com.obra360.application.service.QualidadeService;
import br.com.obra360.domain.entity.EvidenciaQualidadeEntity;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController @RequestMapping("/api/v1/workspace/qualidade/{id}/evidencias")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','AUDITOR')")
public class QualidadeEvidenciaController {
    private final QualidadeService service;
    public QualidadeEvidenciaController(QualidadeService service) {this.service=service;}
    @GetMapping public List<EvidenciaQualidadeEntity> list(@PathVariable Long id) {return service.evidence(id);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO')")
    public EvidenciaQualidadeEntity upload(@PathVariable Long id,@RequestPart("arquivo") MultipartFile file,Authentication auth) {return service.attach(id,file,Long.valueOf(auth.getName()));}
    @GetMapping("/{evidenceId}/arquivo") public ResponseEntity<byte[]> download(@PathVariable Long id,@PathVariable Long evidenceId) {
        var photo=service.download(id,evidenceId);String extension="image/png".equals(photo.evidence().getMime())?"png":"jpg";
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.parseMediaType(photo.evidence().getMime()))
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename("evidencia-"+evidenceId+"."+extension).build().toString()).body(photo.bytes());
    }
}
