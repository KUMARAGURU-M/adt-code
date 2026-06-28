package com.arrowdatatech.adt_production_report.job.repository;

import com.arrowdatatech.adt_production_report.job.entity.ImportFieldMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportFieldMappingRepository
        extends JpaRepository<ImportFieldMapping, UUID> {

    // One mapping per project (unique constraint in DB)
    Optional<ImportFieldMapping> findByProjectId(UUID projectId);

    boolean existsByProjectId(UUID projectId);
}