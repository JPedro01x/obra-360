package com.obra360.application.usecase;

import com.obra360.domain.entity.ConstructionOccurrence;
import com.obra360.infrastructure.persistence.OccurrenceJpaEntity;
import com.obra360.infrastructure.persistence.SpringDataOccurrenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OccurrenceService {

    private final SpringDataOccurrenceRepository occurrenceRepository;

    public OccurrenceService(SpringDataOccurrenceRepository occurrenceRepository) {
        this.occurrenceRepository = occurrenceRepository;
    }

    @Transactional(readOnly = true)
    public List<ConstructionOccurrence> findAllOccurrences() {
        return occurrenceRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConstructionOccurrence> findByProjectId(String projectId) {
        return occurrenceRepository.findByProjectId(projectId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConstructionOccurrence createOccurrence(ConstructionOccurrence occurrence) {
        if (occurrence.getId() == null || occurrence.getId().trim().isEmpty()) {
            occurrence.setId("OCC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        OccurrenceJpaEntity entity = toJpaEntity(occurrence);
        OccurrenceJpaEntity saved = occurrenceRepository.save(entity);
        return toDomain(saved);
    }

    @Transactional
    public ConstructionOccurrence resolveOccurrence(String id, String resolutionNotes) {
        OccurrenceJpaEntity entity = occurrenceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ocorrência não encontrada com ID: " + id));

        String updatedDescription = entity.getDescription();
        if (resolutionNotes != null && !resolutionNotes.trim().isEmpty()) {
            updatedDescription += "\n[RESOLUÇÃO]: " + resolutionNotes;
        }

        OccurrenceJpaEntity updated = new OccurrenceJpaEntity(
                entity.getId(),
                entity.getProjectId(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getSeverity(),
                updatedDescription,
                entity.getAssignedTo(),
                "RESOLVIDO",
                entity.getReportedBy(),
                entity.isHasPhoto()
        );

        OccurrenceJpaEntity saved = occurrenceRepository.save(updated);
        return toDomain(saved);
    }

    private ConstructionOccurrence toDomain(OccurrenceJpaEntity entity) {
        ConstructionOccurrence occ = new ConstructionOccurrence();
        occ.setId(entity.getId());
        occ.setProjectId(entity.getProjectId());
        occ.setTitle(entity.getTitle());
        occ.setCategory(entity.getCategory());
        occ.setSeverity(entity.getSeverity());
        occ.setDescription(entity.getDescription());
        occ.setAssignedTo(entity.getAssignedTo());
        occ.setStatus(entity.getStatus());
        occ.setReportedBy(entity.getReportedBy());
        occ.setCreatedAt(entity.getCreatedAt());
        occ.setHasPhoto(entity.isHasPhoto());
        return occ;
    }

    private OccurrenceJpaEntity toJpaEntity(ConstructionOccurrence domain) {
        return new OccurrenceJpaEntity(
                domain.getId(),
                domain.getProjectId(),
                domain.getTitle(),
                domain.getCategory(),
                domain.getSeverity(),
                domain.getDescription(),
                domain.getAssignedTo(),
                domain.getStatus() != null ? domain.getStatus() : "EM_CORRECAO",
                domain.getReportedBy(),
                domain.isHasPhoto()
        );
    }
}
