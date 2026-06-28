package com.arrowdatatech.adt_production_report.shift.repository;

import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, UUID> {

    List<Shift> findByIsActiveTrueOrderByName();

    Optional<Shift> findByName(String name);

    boolean existsByName(String name);

    // Get shift with all currently assigned employees
    @Query("""
            SELECT s FROM Shift s
            LEFT JOIN FETCH s.userAssignments sua
            LEFT JOIN FETCH sua.user u
            LEFT JOIN FETCH u.employeeProfile ep
            WHERE s.id = :shiftId
            AND sua.effectiveTo IS NULL
            """)
    Optional<Shift> findByIdWithCurrentEmployees(UUID shiftId);
}