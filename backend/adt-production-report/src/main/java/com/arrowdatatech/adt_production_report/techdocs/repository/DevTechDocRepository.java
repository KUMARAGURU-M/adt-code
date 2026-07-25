package com.arrowdatatech.adt_production_report.techdocs.repository;

import com.arrowdatatech.adt_production_report.techdocs.entity.DevTechDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DevTechDocRepository extends JpaRepository<DevTechDoc, UUID> {
    List<DevTechDoc> findByUserId(UUID userId);
}
