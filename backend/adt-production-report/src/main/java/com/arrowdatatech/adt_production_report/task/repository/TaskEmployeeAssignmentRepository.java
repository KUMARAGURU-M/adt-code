package com.arrowdatatech.adt_production_report.task.repository;

import com.arrowdatatech.adt_production_report.task.entity.TaskEmployeeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskEmployeeAssignmentRepository
        extends JpaRepository<TaskEmployeeAssignment, UUID> {

    List<TaskEmployeeAssignment> findByTaskId(UUID taskId);

    List<TaskEmployeeAssignment> findByUserId(UUID userId);

    // Get specific assignment for a user+task
    Optional<TaskEmployeeAssignment> findByTaskIdAndUserId(
            UUID taskId, UUID userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TaskEmployeeAssignment t WHERE t.task.id = :taskId")
    void deleteByTaskId(@Param("taskId") UUID taskId);

    @Modifying
    @Transactional
    @Query("""
            UPDATE TaskEmployeeAssignment t
            SET t.status = :status,
                t.pagesCompleted = :pagesCompleted,
                t.updatedAt = :now
            WHERE t.task.id = :taskId
            AND t.user.id = :userId
            """)
    void updateEmployeeTaskProgress(
            @Param("taskId")         UUID taskId,
            @Param("userId")         UUID userId,
            @Param("status")         String status,
            @Param("pagesCompleted") Integer pagesCompleted,
            @Param("now")
            java.time.OffsetDateTime now);

    // Get total pages completed by user for a task
    @Query("""
            SELECT COALESCE(tea.pagesCompleted, 0)
            FROM TaskEmployeeAssignment tea
            WHERE tea.task.id = :taskId
            AND tea.user.id = :userId
            """)
    Integer getPagesCompletedByUserForTask(
            @Param("taskId") UUID taskId,
            @Param("userId") UUID userId);
}