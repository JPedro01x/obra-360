package com.obra360.application.usecase;

import com.obra360.domain.entity.B2bMaterialRFQ;
import com.obra360.domain.strategy.SefazNfeValidationStrategy;
import com.obra360.domain.valueobject.NfeKey;
import com.obra360.infrastructure.persistence.B2bMaterialRfqJpaEntity;
import com.obra360.infrastructure.persistence.SpringDataB2bRfqRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class B2bMarketplaceService {

    private final SpringDataB2bRfqRepository rfqRepository;
    private final SefazNfeValidationStrategy sefazNfeValidationStrategy;

    public B2bMarketplaceService(SpringDataB2bRfqRepository rfqRepository, SefazNfeValidationStrategy sefazNfeValidationStrategy) {
        this.rfqRepository = rfqRepository;
        this.sefazNfeValidationStrategy = sefazNfeValidationStrategy;
    }

    @Transactional(readOnly = true)
    public List<B2bMaterialRFQ> findAllRfqs() {
        return rfqRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Transactional
    public B2bMaterialRFQ createRfq(B2bMaterialRFQ rfq) {
        if (rfq.getId() == null || rfq.getId().trim().isEmpty()) {
            rfq.setId("RFQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        B2bMaterialRfqJpaEntity entity = toJpaEntity(rfq);
        B2bMaterialRfqJpaEntity saved = rfqRepository.save(entity);
        return toDomain(saved);
    }

    @Transactional
    public B2bMaterialRFQ submitSupplierQuote(String rfqId, String supplierName, double quotePrice) {
        B2bMaterialRfqJpaEntity entity = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new IllegalArgumentException("Cotação RFQ não encontrada com ID: " + rfqId));

        if (entity.getBestQuotePrice() == null || quotePrice < entity.getBestQuotePrice()) {
            entity.setBestQuoteSupplier(supplierName);
            entity.setBestQuotePrice(quotePrice);
        }
        B2bMaterialRfqJpaEntity updated = rfqRepository.save(entity);
        return toDomain(updated);
    }

    public boolean verifyNfeKey(String nfeKey) {
        if (nfeKey == null || nfeKey.trim().isEmpty()) {
            return false;
        }
        return sefazNfeValidationStrategy.validate(new NfeKey(nfeKey));
    }

    private B2bMaterialRFQ toDomain(B2bMaterialRfqJpaEntity entity) {
        B2bMaterialRFQ rfq = new B2bMaterialRFQ();
        rfq.setId(entity.getId());
        rfq.setTitle(entity.getTitle());
        rfq.setRequester(entity.getRequester());
        rfq.setCategory(entity.getCategory());
        rfq.setQuantityNeeded(entity.getQuantityNeeded());
        rfq.setUnit(entity.getUnit());
        rfq.setStatus(entity.getStatus());
        rfq.setBestQuoteSupplier(entity.getBestQuoteSupplier());
        rfq.setBestQuotePrice(entity.getBestQuotePrice() != null ? entity.getBestQuotePrice() : 0.0);
        rfq.setDeadline(entity.getDeadline());
        return rfq;
    }

    private B2bMaterialRfqJpaEntity toJpaEntity(B2bMaterialRFQ rfq) {
        return new B2bMaterialRfqJpaEntity(
                rfq.getId(),
                rfq.getTitle(),
                rfq.getRequester(),
                rfq.getCategory(),
                rfq.getQuantityNeeded(),
                rfq.getUnit(),
                rfq.getStatus(),
                rfq.getBestQuoteSupplier(),
                rfq.getBestQuotePrice(),
                rfq.getDeadline()
        );
    }
}
