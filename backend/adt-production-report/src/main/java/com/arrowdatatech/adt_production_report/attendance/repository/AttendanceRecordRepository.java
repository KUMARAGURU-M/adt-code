package com.arrowdatatech.adt_production_report.attendance.repository;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository
        extends JpaRepository<AttendanceRecord, UUID> {

    // All records for a month range (for all employees)
    List<AttendanceRecord> findByAttendanceDateBetween(
            LocalDate start, LocalDate end);

    // Records for one employee in a date range
    List<AttendanceRecord> findByEmployeeIdAndAttendanceDateBetween(
            UUID employeeId, LocalDate start, LocalDate end);

    // Single record lookup
    Optional<AttendanceRecord> findByEmployeeIdAndAttendanceDate(
            UUID employeeId, LocalDate date);

    // Quick-mark: delete existing records for a day before bulk insert
    @Modifying
    @Transactional
    @Query("DELETE FROM AttendanceRecord r WHERE r.attendanceDate = :date")
    void deleteByAttendanceDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(DISTINCT r.employee.id) FROM AttendanceRecord r WHERE r.attendanceDate = :date AND r.checkInTime IS NOT NULL")
    long countActiveEmployeesOnDate(@Param("date") LocalDate date);
}