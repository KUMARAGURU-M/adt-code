package com.arrowdatatech.adt_production_report.leave.repository;

import com.arrowdatatech.adt_production_report.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {
    List<LeaveType> findByIsActiveTrueOrderByNameAsc();
    boolean existsByCodeAndIsActiveTrue(String code);
}