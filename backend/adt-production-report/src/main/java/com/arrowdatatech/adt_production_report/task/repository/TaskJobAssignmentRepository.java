package com.arrowdatatech.adt_production_report.task.repository;

import com.arrowdatatech.adt_production_report.task.entity.TaskJobAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskJobAssignmentRepository
        extends JpaRepository<TaskJobAssignment, UUID> {

    List<TaskJobAssignment> findByTaskId(UUID taskId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TaskJobAssignment t WHERE t.task.id = :taskId")
    void deleteByTaskId(@Param("taskId") UUID taskId);

    @Query("""
        SELECT tja FROM TaskJobAssignment tja
        JOIN FETCH tja.task t
        JOIN FETCH t.process p
        LEFT JOIN FETCH t.employeeAssignments tea
        LEFT JOIN FETCH tea.user u
        LEFT JOIN FETCH u.employeeProfile ep
        WHERE tja.job.id IN :jobIds
    """)
    List<TaskJobAssignment> findAssignmentsByJobIds(@Param("jobIds") List<UUID> jobIds);
}