package com.arrowdatatech.adt_production_report.workwise.repository;

import com.arrowdatatech.adt_production_report.workwise.entity.BreakLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BreakLogRepository extends JpaRepository<BreakLog, UUID> {

    // Uses breakEnd field name (maps to break_end column)
    Optional<BreakLog> findByTimeLogIdAndBreakEndIsNull(UUID timeLogId);

    boolean existsByTimeLogIdAndBreakEndIsNull(UUID timeLogId);

    // Uses breakStart field name (maps to break_start column)
    List<BreakLog> findByTimeLogIdOrderByBreakStartAsc(UUID timeLogId);

    @Query("""
            SELECT COALESCE(SUM(b.durationSeconds), 0)
            FROM BreakLog b
            WHERE b.timeLog.id = :timeLogId
            AND b.durationSeconds IS NOT NULL
            """)
    Integer sumBreakSecondsForTimeLog(@Param("timeLogId") UUID timeLogId);
}