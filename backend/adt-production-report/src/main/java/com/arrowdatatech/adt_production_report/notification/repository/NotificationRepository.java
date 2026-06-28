package com.arrowdatatech.adt_production_report.notification.repository;

import com.arrowdatatech.adt_production_report.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    @Modifying
    @Transactional
    @Query("""
            UPDATE Notification n
            SET n.isRead = true,
                n.readAt = :now
            WHERE n.user.id = :userId
            AND n.isRead = false
            """)
    void markAllAsRead(UUID userId, OffsetDateTime now);

    @Modifying
    @Transactional
    @Query("""
            UPDATE Notification n
            SET n.isRead = true,
                n.readAt = :now
            WHERE n.id = :id
            AND n.user.id = :userId
            """)
    void markAsRead(UUID id, UUID userId, OffsetDateTime now);
}