package com.arrowdatatech.adt_production_report.attendance.repository;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceSalaryDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceSalaryDetailRepository
        extends JpaRepository<AttendanceSalaryDetail, UUID> {

    // Load all salary details for a specific month
    List<AttendanceSalaryDetail> findByYearAndMonth(Short year, Short month);

    // Load salary detail for one employee for a month
    Optional<AttendanceSalaryDetail> findByEmployeeIdAndYearAndMonth(
            UUID employeeId, Short year, Short month);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByYearAndMonth(Short year, Short month);
}