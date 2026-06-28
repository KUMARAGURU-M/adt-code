package com.arrowdatatech.adt_production_report.job.repository;

import com.arrowdatatech.adt_production_report.job.entity.ImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImportBatchRepository
        extends JpaRepository<ImportBatch, UUID> {

    List<ImportBatch> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}