package com.arrowdatatech.adt_production_report.shift.repository;

import com.arrowdatatech.adt_production_report.shift.entity.ShiftUserAssignment;
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
public interface ShiftUserAssignmentRepository
        extends JpaRepository<ShiftUserAssignment, UUID> {

    Optional<ShiftUserAssignment> findByUserIdAndEffectiveToIsNull(
            UUID userId);

    // All current employees of a specific shift
    List<ShiftUserAssignment> findByShiftIdAndEffectiveToIsNull(
            UUID shiftId);

    boolean existsByUserIdAndEffectiveToIsNull(UUID userId);

    // NEW - needed for delete check
    boolean existsByShiftIdAndEffectiveToIsNull(UUID shiftId);

    @Modifying
    @Transactional
    @Query("""
            UPDATE ShiftUserAssignment sua
            SET sua.effectiveTo = :effectiveTo
            WHERE sua.user.id = :userId
            AND sua.effectiveTo IS NULL
            """)
    void closeCurrentShift(@Param("userId") UUID userId,
                           @Param("effectiveTo") LocalDate effectiveTo);
}