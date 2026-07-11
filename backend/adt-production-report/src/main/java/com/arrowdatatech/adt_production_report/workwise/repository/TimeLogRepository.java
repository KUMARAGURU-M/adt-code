package com.arrowdatatech.adt_production_report.workwise.repository;

import com.arrowdatatech.adt_production_report.workwise.entity.TimeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, UUID> {

    Optional<TimeLog> findByUserIdAndStatus(UUID userId, String status);

    boolean existsByUserIdAndStatus(UUID userId, String status);

    @Query("""
            SELECT t FROM TimeLog t
            WHERE t.user.id = :userId
            AND (:clientId IS NULL OR (t.project IS NOT NULL AND t.project.client.id = :clientId))
            AND (:projectId IS NULL OR t.project.id = :projectId)
            AND (:workflowId IS NULL OR (t.project IS NOT NULL AND t.project.workflow.id = :workflowId))
            AND (:processId IS NULL OR t.process.id = :processId)
            AND (:status IS NULL OR t.status = :status)
            AND (CAST(:startDate AS date) IS NULL OR t.logDate >= :startDate)
            AND (CAST(:endDate AS date) IS NULL OR t.logDate <= :endDate)
            ORDER BY t.startTime DESC
            """)
    Page<TimeLog> searchTimeLogs(
            @Param("userId")     UUID userId,
            @Param("clientId")   UUID clientId,
            @Param("projectId")  UUID projectId,
            @Param("workflowId") UUID workflowId,
            @Param("processId")  UUID processId,
            @Param("status")     String status,
            @Param("startDate")  LocalDate startDate,
            @Param("endDate")    LocalDate endDate,
            Pageable pageable
    );

    @Query("""
            SELECT t FROM TimeLog t
            WHERE (:userId IS NULL OR t.user.id = :userId)
            AND (:projectId IS NULL OR t.project.id = :projectId)
            AND (:processId IS NULL OR t.process.id = :processId)
            AND (:status IS NULL OR t.status = :status)
            AND (CAST(:startDate AS date) IS NULL OR t.logDate >= :startDate)
            AND (CAST(:endDate AS date) IS NULL OR t.logDate <= :endDate)
            ORDER BY t.startTime DESC
            """)
    List<TimeLog> searchAdminTimeLogs(
            @Param("userId")    UUID userId,
            @Param("projectId") UUID projectId,
            @Param("processId") UUID processId,
            @Param("status")    String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    @Query("""
            SELECT t FROM TimeLog t
            LEFT JOIN FETCH t.project
            WHERE t.user.id = :userId
            AND t.logDate >= :startDate
            AND t.logDate <= :endDate
            ORDER BY t.logDate ASC
            """)
    List<TimeLog> findByUserIdAndLogDateBetween(
            @Param("userId")    UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.workingSeconds), 0) FROM TimeLog t")
    long sumTotalWorkingSeconds();

    @Query("SELECT COUNT(t) FROM TimeLog t WHERE t.logDate = :date AND t.status = 'FINISH'")
    long countTasksCompletedOnDate(@Param("date") LocalDate date);
}