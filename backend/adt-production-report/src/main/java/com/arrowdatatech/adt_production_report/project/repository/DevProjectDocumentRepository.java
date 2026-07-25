package com.arrowdatatech.adt_production_report.project.repository;

import com.arrowdatatech.adt_production_report.project.entity.DevProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DevProjectDocumentRepository extends JpaRepository<DevProjectDocument, UUID> {
    List<DevProjectDocument> findByProjectId(UUID projectId);
}
