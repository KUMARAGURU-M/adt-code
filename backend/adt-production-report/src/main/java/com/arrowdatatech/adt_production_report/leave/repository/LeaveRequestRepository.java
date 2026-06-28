package com.arrowdatatech.adt_production_report.leave.repository;

import com.arrowdatatech.adt_production_report.leave.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    // Admin: search with filters
    @Query("""
            SELECT r FROM LeaveRequest r
            JOIN r.user u
            JOIN r.leaveType lt
            WHERE (:userId    IS NULL OR u.id = :userId)
            AND   (:status    IS NULL OR r.status = :status)
            AND   (:leaveTypeId IS NULL OR lt.id = :leaveTypeId)
            ORDER BY r.appliedAt DESC
            """)
    Page<LeaveRequest> searchRequests(
            @Param("userId")      UUID userId,
            @Param("status")      String status,
            @Param("leaveTypeId") UUID leaveTypeId,
            Pageable pageable
    );

    // Employee: my requests
    List<LeaveRequest> findByUserIdOrderByAppliedAtDesc(UUID userId);

    // Check overlapping requests for same user
    @Query("""
            SELECT COUNT(r) > 0 FROM LeaveRequest r
            WHERE r.user.id = :userId
            AND r.status NOT IN ('Rejected','Cancelled')
            AND r.startDate <= :endDate
            AND r.endDate   >= :startDate
            """)
    boolean hasOverlap(
            @Param("userId")    UUID userId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate")   java.time.LocalDate endDate
    );
}