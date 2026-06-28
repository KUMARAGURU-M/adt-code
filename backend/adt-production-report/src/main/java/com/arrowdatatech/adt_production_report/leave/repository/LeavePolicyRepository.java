package com.arrowdatatech.adt_production_report.leave.repository;

import com.arrowdatatech.adt_production_report.leave.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, UUID> {
    List<LeavePolicy> findByIsActiveTrueOrderByNameAsc();
}