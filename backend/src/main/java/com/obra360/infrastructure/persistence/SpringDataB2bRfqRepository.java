package com.obra360.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataB2bRfqRepository extends JpaRepository<B2bMaterialRfqJpaEntity, String> {
}
