package com.arrowdatatech.adt_production_report.correction.repository;

import com.arrowdatatech.adt_production_report.correction.entity.DevCorrection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DevCorrectionRepository extends JpaRepository<DevCorrection, UUID> {
    List<DevCorrection> findByAssignedToId(UUID userId);
}
