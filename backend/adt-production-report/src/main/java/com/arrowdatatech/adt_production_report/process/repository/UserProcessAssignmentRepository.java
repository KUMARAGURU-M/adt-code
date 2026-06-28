package com.arrowdatatech.adt_production_report.process.repository;

import com.arrowdatatech.adt_production_report.process.entity.UserProcessAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserProcessAssignmentRepository
        extends JpaRepository<UserProcessAssignment, UUID> {

    List<UserProcessAssignment> findByUserId(UUID userId);

    boolean existsByUserIdAndProcessId(UUID userId, UUID processId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserProcessAssignment upa WHERE upa.user.id = :userId")
    void deleteAllByUserId(UUID userId);
}