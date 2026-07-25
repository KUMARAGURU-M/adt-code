package com.arrowdatatech.adt_production_report.overtime.repository;

import com.arrowdatatech.adt_production_report.overtime.entity.DevOvertime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DevOvertimeRepository extends JpaRepository<DevOvertime, UUID> {
    List<DevOvertime> findByUserId(UUID userId);
}
