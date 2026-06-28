package com.arrowdatatech.adt_production_report.common.audit.repository;

import com.arrowdatatech.adt_production_report.common.audit.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    // Activity logs page with filters
    @Query("""
            SELECT al FROM ActivityLog al
            LEFT JOIN al.user u
            WHERE (:userId IS NULL OR al.user.id = :userId)
            AND (:action IS NULL OR al.action = :action)
            AND (:entityType IS NULL OR al.entityType = :entityType)
            ORDER BY al.createdAt DESC
            """)
    Page<ActivityLog> filterActivityLogs(UUID userId, String action,
                                         String entityType,
                                         Pageable pageable);
}