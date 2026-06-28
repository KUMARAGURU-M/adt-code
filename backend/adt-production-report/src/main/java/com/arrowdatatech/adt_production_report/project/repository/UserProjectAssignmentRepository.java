package com.arrowdatatech.adt_production_report.project.repository;

import com.arrowdatatech.adt_production_report.project.entity.UserProjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserProjectAssignmentRepository
        extends JpaRepository<UserProjectAssignment, UUID> {

    List<UserProjectAssignment> findByUserId(UUID userId);

    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);

    // Remove all project assignments for a user before reassigning
    @Modifying
    @Transactional
    @Query("DELETE FROM UserProjectAssignment upa WHERE upa.user.id = :userId")
    void deleteAllByUserId(UUID userId);

    // Remove specific assignment
    @Modifying
    @Transactional
    @Query("""
            DELETE FROM UserProjectAssignment upa
            WHERE upa.user.id = :userId
            AND upa.project.id = :projectId
            """)
    void deleteByUserIdAndProjectId(UUID userId, UUID projectId);
}