package com.arrowdatatech.adt_production_report.task.repository;

import com.arrowdatatech.adt_production_report.task.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    // ─────────────────────────────────────────────────────────────
    // Admin search — all tasks, all filters
    // ─────────────────────────────────────────────────────────────
    @Query("""
            SELECT DISTINCT t FROM Task t
            LEFT JOIN FETCH t.project p
            LEFT JOIN FETCH p.client c
            LEFT JOIN FETCH p.workflow w
            LEFT JOIN FETCH t.process proc
            WHERE (:projectId IS NULL OR p.id = :projectId)
            AND   (:clientId IS NULL OR c.id = :clientId)
            AND   (:workflowId IS NULL OR w.id = :workflowId)
            AND   (:processId IS NULL OR proc.id = :processId)
            AND   (:status    IS NULL OR t.status = :status)
            AND   (:search IS NULL OR :search = ''
                   OR LOWER(t.taskTitle) LIKE LOWER(CONCAT('%',:search,'%')))
            AND   (:userId IS NULL OR EXISTS (
                      SELECT tea FROM TaskEmployeeAssignment tea
                      WHERE tea.task = t AND tea.user.id = :userId))
            ORDER BY t.assignedDate DESC, t.createdAt DESC
            """)
    Page<Task> searchTasks(
            @Param("projectId")  UUID projectId,
            @Param("clientId")   UUID clientId,
            @Param("workflowId") UUID workflowId,
            @Param("processId")  UUID processId,
            @Param("userId")     UUID userId,
            @Param("status")     String status,
            @Param("search")     String search,
            Pageable pageable
    );

    // ─────────────────────────────────────────────────────────────
    // Employee: ACTIVE (not completed) tasks assigned to THIS user.
    // BUG FIX: tea.status DB constraint = ('Pending','In Progress','Completed')
    //          — 'FINISH' never appears there, so we filter only 'Completed'.
    //          Task.status IS checked for both 'FINISH' and 'Completed'
    //          because WorkwiseService writes 'FINISH' to tasks.status.
    // Priority = earliest tea.createdAt (first assigned = do first).
    // ─────────────────────────────────────────────────────────────
    @Query("""
            SELECT t FROM Task t
            WHERE t.id IN (
                SELECT tea.task.id FROM TaskEmployeeAssignment tea
                WHERE tea.user.id = :userId
                AND   tea.status != 'Completed'
            )
            AND t.status NOT IN ('FINISH', 'Completed')
            ORDER BY (
                SELECT MIN(tea2.createdAt)
                FROM TaskEmployeeAssignment tea2
                WHERE tea2.task.id = t.id
                AND   tea2.user.id = :userId
            ) ASC
            """)
    List<Task> findByAssignedUserId(@Param("userId") UUID userId);

    // ─────────────────────────────────────────────────────────────
    // Employee: ALL tasks assigned to this user (including completed).
    // Used by getMyTaskOptions so completed tasks appear in dropdown.
    // ─────────────────────────────────────────────────────────────
    @Query("""
            SELECT t FROM Task t
            WHERE t.id IN (
                SELECT tea.task.id FROM TaskEmployeeAssignment tea
                WHERE tea.user.id = :userId
            )
            ORDER BY (
                SELECT MAX(tea2.updatedAt)
                FROM TaskEmployeeAssignment tea2
                WHERE tea2.task.id = t.id
                AND   tea2.user.id = :userId
            ) DESC
            """)
    List<Task> findAllByAssignedUserId(@Param("userId") UUID userId);

    // ─────────────────────────────────────────────────────────────
    // First incomplete task for this user — used for nextTask banner.
    // ─────────────────────────────────────────────────────────────
    @Query("""
            SELECT t FROM Task t
            WHERE t.id IN (
                SELECT tea.task.id FROM TaskEmployeeAssignment tea
                WHERE tea.user.id = :userId
                AND   tea.status != 'Completed'
            )
            AND t.status NOT IN ('FINISH', 'Completed')
            ORDER BY (
                SELECT MIN(tea2.createdAt)
                FROM TaskEmployeeAssignment tea2
                WHERE tea2.task.id = t.id
                AND   tea2.user.id = :userId
            ) ASC
            """)
    List<Task> findNextTaskForUser(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("SELECT COUNT(t) FROM Task t")
    long countTotalTasks();

    @Query("SELECT DISTINCT t.process.name FROM Task t WHERE t.project.id = :projectId AND t.process IS NOT NULL")
    List<String> findProcessNamesByProjectId(@Param("projectId") UUID projectId);

    @Query("""
           SELECT DISTINCT t.project.id, t.process.name
           FROM Task t
           WHERE t.project.id IN :projectIds
           AND t.process IS NOT NULL
           """)
    List<Object[]> findProcessNamesByProjectIds(@Param("projectIds") List<UUID> projectIds);
}