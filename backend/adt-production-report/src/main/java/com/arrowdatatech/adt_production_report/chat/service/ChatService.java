package com.arrowdatatech.adt_production_report.chat.service;

import com.arrowdatatech.adt_production_report.chat.dto.ChatContactResponse;
import com.arrowdatatech.adt_production_report.chat.dto.ChatMessageRequest;
import com.arrowdatatech.adt_production_report.chat.dto.ChatMessageResponse;
import com.arrowdatatech.adt_production_report.chat.dto.ConversationResponse;
import com.arrowdatatech.adt_production_report.chat.entity.ChatMessage;
import com.arrowdatatech.adt_production_report.chat.repository.ChatMessageRepository;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.repository.MediaFileRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final MediaFileRepository mediaFileRepository;

    /**
     * Get all active users except the current user to build the contacts list.
     */
    public List<ChatContactResponse> getContacts(UUID currentUserId) {
        List<User> users = userRepository.findByIsActiveTrueAndDeletedAtIsNull();
        return users.stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .map(user -> {
                    ChatContactResponse resp = mapToChatContactResponse(user);
                    long unread = chatMessageRepository.countBySenderIdAndRecipientIdAndIsReadFalse(user.getId(), currentUserId);
                    resp.setUnreadCount(unread);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    /**
     * Fetch direct messaging history between two users.
     */
    public List<ChatMessageResponse> getChatHistory(UUID user1Id, UUID user2Id) {
        List<ChatMessage> messages = chatMessageRepository.findChatHistory(user1Id, user2Id);
        return messages.stream()
                .map(this::mapToChatMessageResponse)
                .collect(Collectors.toList());
    }

    /**
     * Send a chat message (text, media, or both).
     */
    @Transactional
    public ChatMessageResponse sendMessage(UUID senderId, ChatMessageRequest request) {
        if ((request.getMessage() == null || request.getMessage().trim().isEmpty()) 
                && request.getMediaFileId() == null) {
            throw new BadRequestException("Message text or media file is required");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        MediaFile mediaFile = null;
        if (request.getMediaFileId() != null) {
            mediaFile = mediaFileRepository.findById(request.getMediaFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Media file not found"));
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .message(request.getMessage())
                .mediaFile(mediaFile)
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        return mapToChatMessageResponse(saved);
    }

    /**
     * Mark all unread messages from a specific sender to the current user as read.
     */
    @Transactional
    public void markAsRead(UUID recipientId, UUID senderId) {
        chatMessageRepository.markAsRead(senderId, recipientId);
    }

    /**
     * Get total count of unread chat messages for a user.
     */
    public long getUnreadCount(UUID recipientId) {
        return chatMessageRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    /**
     * Admin-only: Retrieve all conversation pairs in the system.
     */
    public List<ConversationResponse> getLatestConversations() {
        List<ChatMessage> latestMessages = chatMessageRepository.findLatestConversations();
        List<ConversationResponse> conversations = new ArrayList<>();

        for (ChatMessage message : latestMessages) {
            User sender = message.getSender();
            User recipient = message.getRecipient();

            // Order consistently so user1 has the lexically smaller UUID
            User user1 = sender.getId().toString().compareTo(recipient.getId().toString()) < 0 ? sender : recipient;
            User user2 = user1 == sender ? recipient : sender;

            long msgCount = chatMessageRepository.countChatMessages(user1.getId(), user2.getId());

            conversations.add(ConversationResponse.builder()
                    .user1(mapToChatContactResponse(user1))
                    .user2(mapToChatContactResponse(user2))
                    .lastMessage(mapToChatMessageResponse(message))
                    .messageCount(msgCount)
                    .build());
        }

        return conversations;
    }

    /**
     * Delete chat messages and associated attachment files older than 15 days.
     */
    @Transactional
    public void cleanupOldMessages() {
        java.time.OffsetDateTime cutoff = java.time.OffsetDateTime.now().minusDays(15);
        log.info("Cleaning up chat messages and attachments older than cutoff: {}", cutoff);

        // 1. Find all media files with entityType='chat' older than 15 days (covers both sent and orphaned files)
        List<MediaFile> mediaFilesToDelete = mediaFileRepository.findChatMediaFilesOlderThan(cutoff);

        // 2. Delete the messages older than 15 days
        chatMessageRepository.deleteMessagesOlderThan(cutoff);
        chatMessageRepository.flush();

        // 3. Delete the media file records from database and their physical files from disk
        if (mediaFilesToDelete != null && !mediaFilesToDelete.isEmpty()) {
            log.info("Found {} chat attachments to delete from database and disk", mediaFilesToDelete.size());
            for (MediaFile mediaFile : mediaFilesToDelete) {
                if (mediaFile != null) {
                    try {
                        // Delete from disk
                        String storagePathStr = mediaFile.getStoragePath();
                        if (storagePathStr != null) {
                            java.nio.file.Path path = java.nio.file.Paths.get(storagePathStr).normalize();
                            if (java.nio.file.Files.deleteIfExists(path)) {
                                log.info("Deleted chat attachment file from disk: {}", storagePathStr);
                            } else {
                                log.warn("Chat attachment file did not exist on disk: {}", storagePathStr);
                            }
                        }

                        // Delete from database
                        mediaFileRepository.delete(mediaFile);
                    } catch (Exception e) {
                        log.error("Failed to delete chat attachment ID {}: {}", mediaFile.getId(), e.getMessage(), e);
                    }
                }
            }
            mediaFileRepository.flush();
        }
    }

    @Transactional
    public void clearConversation(UUID user1Id, UUID user2Id) {
        log.info("Admin clearing chat history between {} and {}", user1Id, user2Id);

        // 1. Find all media files for this conversation
        List<ChatMessage> messages = chatMessageRepository.findChatHistory(user1Id, user2Id);
        List<MediaFile> mediaFilesToDelete = messages.stream()
                .map(ChatMessage::getMediaFile)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        // 2. Delete the messages
        chatMessageRepository.deleteChatHistory(user1Id, user2Id);
        chatMessageRepository.flush();

        // 3. Delete the media file records from database and physical files from disk
        if (!mediaFilesToDelete.isEmpty()) {
            log.info("Found {} chat attachments to delete from database and disk", mediaFilesToDelete.size());
            for (MediaFile mediaFile : mediaFilesToDelete) {
                try {
                    // Delete from disk
                    String storagePathStr = mediaFile.getStoragePath();
                    if (storagePathStr != null) {
                        java.nio.file.Path path = java.nio.file.Paths.get(storagePathStr).normalize();
                        if (java.nio.file.Files.deleteIfExists(path)) {
                            log.info("Deleted chat attachment file from disk: {}", storagePathStr);
                        }
                    }
                    // Delete from database
                    mediaFileRepository.delete(mediaFile);
                } catch (Exception e) {
                    log.error("Failed to delete chat attachment ID {}: {}", mediaFile.getId(), e.getMessage());
                }
            }
            mediaFileRepository.flush();
        }
    }

    @Transactional
    public void clearAllConversations() {
        log.info("Admin clearing all conversations and chat history in the system");

        // 1. Find all media files belonging to chat
        List<MediaFile> mediaFilesToDelete = mediaFileRepository.findByEntityType("chat");

        // 2. Delete all chat messages
        chatMessageRepository.deleteAllInBatch();

        // 3. Delete physical files and media file database records
        if (!mediaFilesToDelete.isEmpty()) {
            log.info("Found {} chat attachments to delete from database and disk", mediaFilesToDelete.size());
            for (MediaFile mediaFile : mediaFilesToDelete) {
                try {
                    // Delete from disk
                    String storagePathStr = mediaFile.getStoragePath();
                    if (storagePathStr != null) {
                        java.nio.file.Path path = java.nio.file.Paths.get(storagePathStr).normalize();
                        if (java.nio.file.Files.deleteIfExists(path)) {
                            log.info("Deleted chat attachment file from disk: {}", storagePathStr);
                        }
                    }
                    // Delete from database
                    mediaFileRepository.delete(mediaFile);
                } catch (Exception e) {
                    log.error("Failed to delete chat attachment ID {}: {}", mediaFile.getId(), e.getMessage());
                }
            }
            mediaFileRepository.flush();
        }
    }

    // Helpers
    private ChatContactResponse mapToChatContactResponse(User user) {
        String fullName = user.getEmployeeProfile() != null ? user.getEmployeeProfile().getFullName() : null;
        if (fullName == null || fullName.trim().isEmpty()) {
            fullName = user.getUserCode();
        }

        String role = user.getRoleAssignments().stream()
                .map(ura -> ura.getRole().getName())
                .collect(Collectors.joining(", "));
        if (role.isEmpty()) {
            role = "Employee";
        }

        return ChatContactResponse.builder()
                .id(user.getId())
                .userCode(user.getUserCode())
                .fullName(fullName)
                .email(user.getEmail())
                .role(role)
                .build();
    }

    private ChatMessageResponse mapToChatMessageResponse(ChatMessage message) {
        String senderName = null;
        if (message.getSender() != null) {
            senderName = message.getSender().getEmployeeProfile() != null 
                    ? message.getSender().getEmployeeProfile().getFullName() 
                    : message.getSender().getUserCode();
        }

        String recipientName = null;
        if (message.getRecipient() != null) {
            recipientName = message.getRecipient().getEmployeeProfile() != null 
                    ? message.getRecipient().getEmployeeProfile().getFullName() 
                    : message.getRecipient().getUserCode();
        }

        ChatMessageResponse.MediaFileDetails mediaDetails = null;
        if (message.getMediaFile() != null) {
            MediaFile mf = message.getMediaFile();
            mediaDetails = ChatMessageResponse.MediaFileDetails.builder()
                    .id(mf.getId())
                    .originalName(mf.getOriginalName())
                    .mimeType(mf.getMimeType())
                    .fileSize(mf.getFileSize())
                    .url("/media/" + mf.getId())
                    .build();
        }

        return ChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(senderName)
                .recipientId(message.getRecipient() != null ? message.getRecipient().getId() : null)
                .recipientName(recipientName)
                .message(message.getMessage())
                .mediaFile(mediaDetails)
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
