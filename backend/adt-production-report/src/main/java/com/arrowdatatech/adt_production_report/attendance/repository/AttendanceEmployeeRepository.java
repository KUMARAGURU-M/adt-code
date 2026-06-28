package com.arrowdatatech.adt_production_report.attendance.repository;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceEmployeeRepository
        extends JpaRepository<AttendanceEmployee, UUID> {

    List<AttendanceEmployee> findByIsActiveTrueOrderBySortOrderAscNameAsc();

    java.util.Optional<AttendanceEmployee> findByUserId(UUID userId);

    @Query("""
            SELECT e FROM AttendanceEmployee e
            WHERE e.isActive = true
            AND (:category IS NULL OR e.category = :category)
            AND (CAST(:name AS string) IS NULL OR LOWER(e.name)
                 LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')))
            ORDER BY e.sortOrder ASC, e.name ASC
            """)
    List<AttendanceEmployee> searchEmployees(
            @org.springframework.data.repository.query.Param("category")
            String category,
            @org.springframework.data.repository.query.Param("name")
            String name
    );
}