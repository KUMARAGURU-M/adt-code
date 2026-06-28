package com.arrowdatatech.adt_production_report.auth.repository;

import com.arrowdatatech.adt_production_report.auth.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    Optional<UserSession> findByRefreshTokenAndIsActiveTrue(String refreshToken);

    List<UserSession> findByUserIdAndIsActiveTrue(UUID userId);

    @Modifying
    @Transactional
    @Query("""
            UPDATE UserSession s
            SET s.isActive = false
            WHERE s.user.id = :userId
            """)
    void revokeAllByUserId(UUID userId);

    @Modifying
    @Transactional
    @Query("""
            UPDATE UserSession s
            SET s.isActive = false
            WHERE s.refreshToken = :refreshToken
            """)
    void revokeByRefreshToken(String refreshToken);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM UserSession s
            WHERE s.isActive = false
            AND s.expiresAt < :cutoff
            """)
    void deleteExpiredSessions(OffsetDateTime cutoff);

    @Modifying
    @Transactional
    @Query("""
            UPDATE UserSession s
            SET s.lastUsedAt = :now
            WHERE s.refreshToken = :refreshToken
            """)
    void updateLastUsed(String refreshToken, OffsetDateTime now);
}