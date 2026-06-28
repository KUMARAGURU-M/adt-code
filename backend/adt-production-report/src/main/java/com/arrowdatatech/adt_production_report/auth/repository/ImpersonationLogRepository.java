package com.arrowdatatech.adt_production_report.auth.repository;

import com.arrowdatatech.adt_production_report.auth.entity.ImpersonationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface ImpersonationLogRepository
        extends JpaRepository<ImpersonationLog, UUID> {

    @Modifying
    @Transactional
    @Query("""
            UPDATE ImpersonationLog il
            SET il.endedAt = :now
            WHERE il.admin.id = :adminId
            AND il.endedAt IS NULL
            """)
    void endActiveImpersonation(UUID adminId, OffsetDateTime now);
}