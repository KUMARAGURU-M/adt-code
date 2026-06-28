package com.arrowdatatech.adt_production_report.process.repository;

import com.arrowdatatech.adt_production_report.process.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcessRepository extends JpaRepository<Process, UUID> {

    boolean existsByName(String name);

    List<Process> findByIsActiveTrueOrderByNameAsc();

    // Processes assigned to a specific employee - WorkWise dropdown
    @Query("""
            SELECT p FROM Process p
            JOIN UserProcessAssignment upa ON upa.process.id = p.id
            WHERE upa.user.id = :userId
            AND p.isActive = true
            ORDER BY p.name ASC
            """)
    List<Process> findByAssignedUserId(UUID userId);

    // Processes linked to a specific project via tasks
    @Query("""
            SELECT DISTINCT p FROM Process p
            JOIN Task t ON t.process.id = p.id
            WHERE t.project.id = :projectId
            AND p.isActive = true
            ORDER BY p.name ASC
            """)
    List<Process> findByProjectId(UUID projectId);
}