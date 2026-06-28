package com.arrowdatatech.adt_production_report.attendance.repository;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceSummaryRepository
        extends JpaRepository<AttendanceSummary, UUID> {

    Optional<AttendanceSummary> findByUserIdAndMonth(UUID userId, LocalDate month);

    // Monthly salary summary for all employees - Summary tab
    @Query("""
            SELECT s FROM AttendanceSummary s
            JOIN FETCH s.user u
            JOIN FETCH u.employeeProfile ep
            LEFT JOIN FETCH u.salaryDetails sd
            WHERE s.month = :month
            ORDER BY ep.fullName ASC
            """)
    List<AttendanceSummary> findAllByMonthWithDetails(LocalDate month);

    // Check if record is locked before allowing update
    @Query("SELECT s.isLocked FROM AttendanceSummary s WHERE s.id = :id")
    Optional<Boolean> findIsLockedById(UUID id);

    // Total overall salary for a month - displayed at bottom of summary page
    @Query("""
            SELECT SUM(s.totalSalary) FROM AttendanceSummary s
            WHERE s.month = :month
            """)
    Optional<java.math.BigDecimal> getTotalSalaryForMonth(LocalDate month);
}