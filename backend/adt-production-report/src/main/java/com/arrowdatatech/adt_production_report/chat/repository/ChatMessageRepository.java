package com.arrowdatatech.adt_production_report.chat.repository;

import com.arrowdatatech.adt_production_report.chat.entity.ChatMessage;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m " +
           "LEFT JOIN FETCH m.sender " +
           "LEFT JOIN FETCH m.recipient " +
           "LEFT JOIN FETCH m.mediaFile " +
           "WHERE (m.sender.id = :user1Id AND m.recipient.id = :user2Id) " +
           "OR (m.sender.id = :user2Id AND m.recipient.id = :user1Id) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
 
    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE " +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) " +
           "OR (m.sender.id = :user2Id AND m.recipient.id = :user1Id)")
    void deleteChatHistory(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE " +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) " +
           "OR (m.sender.id = :user2Id AND m.recipient.id = :user1Id)")
    long countChatMessages(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true " +
           "WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.isRead = false")
    void markAsRead(@Param("senderId") UUID senderId, @Param("recipientId") UUID recipientId);

    long countByRecipientIdAndIsReadFalse(UUID recipientId);

    long countBySenderIdAndRecipientIdAndIsReadFalse(UUID senderId, UUID recipientId);

    @Query("SELECT MAX(m.createdAt) FROM ChatMessage m WHERE " +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) " +
           "OR (m.sender.id = :user2Id AND m.recipient.id = :user1Id)")
    java.time.OffsetDateTime findLastMessageTime(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    @Query(value = "WITH RankedMessages AS (" +
                   "  SELECT *, ROW_NUMBER() OVER (" +
                   "    PARTITION BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id) " +
                   "    ORDER BY created_at DESC" +
                   "  ) as rn " +
                   "  FROM chat_messages" +
                   ") " +
                   "SELECT * FROM RankedMessages WHERE rn = 1 ORDER BY created_at DESC",
           nativeQuery = true)
    List<ChatMessage> findLatestConversations();

    @Query("SELECT m.mediaFile FROM ChatMessage m WHERE m.createdAt < :cutoff AND m.mediaFile IS NOT NULL")
    List<MediaFile> findMediaFilesOlderThan(@Param("cutoff") java.time.OffsetDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ChatMessage m WHERE m.createdAt < :cutoff")
    void deleteMessagesOlderThan(@Param("cutoff") java.time.OffsetDateTime cutoff);
}

