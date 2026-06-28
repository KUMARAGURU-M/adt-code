package com.arrowdatatech.adt_production_report.project.repository;

import com.arrowdatatech.adt_production_report.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    boolean existsByName(String name);

    // All active projects - admin project management page
    List<Project> findByIsActiveTrueOrderByNameAsc();

    // Projects assigned to a specific employee - WorkWise dropdown
    @Query("""
            SELECT p FROM Project p
            JOIN UserProjectAssignment upa ON upa.project.id = p.id
            WHERE upa.user.id = :userId
            AND p.isActive = true
            ORDER BY p.name ASC
            """)
    List<Project> findByAssignedUserId(UUID userId);

    // Projects for invoice generation dropdown
    @Query("""
            SELECT p FROM Project p
            WHERE p.client.id = :clientId
            AND p.isActive = true
            ORDER BY p.name ASC
            """)
    List<Project> findByClientId(UUID clientId);

    @Query("SELECT COUNT(p) FROM Project p")
    long countTotalProjects();

    @Query("SELECT COUNT(p) FROM Project p WHERE p.isActive = true")
    long countActiveProjects();
}