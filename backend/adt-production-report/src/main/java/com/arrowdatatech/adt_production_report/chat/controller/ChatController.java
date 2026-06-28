package com.arrowdatatech.adt_production_report.chat.controller;

import com.arrowdatatech.adt_production_report.chat.dto.ChatContactResponse;
import com.arrowdatatech.adt_production_report.chat.dto.ChatMessageRequest;
import com.arrowdatatech.adt_production_report.chat.dto.ChatMessageResponse;
import com.arrowdatatech.adt_production_report.chat.dto.ConversationResponse;
import com.arrowdatatech.adt_production_report.chat.service.ChatService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Get list of users available for chat.
     */
    @GetMapping("/contacts")
    public ResponseEntity<ApiResponse<List<ChatContactResponse>>> getContacts() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<ChatContactResponse> contacts = chatService.getContacts(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Contacts retrieved successfully", contacts));
    }

    /**
     * Get total unread message count for the current user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        long count = chatService.getUnreadCount(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved successfully", count));
    }

    /**
     * Get message history between logged-in user and recipient.
     */
    @GetMapping("/messages/{recipientId}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getChatHistory(
            @PathVariable UUID recipientId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<ChatMessageResponse> history = chatService.getChatHistory(currentUserId, recipientId);
        return ResponseEntity.ok(ApiResponse.success("Chat history retrieved successfully", history));
    }

    /**
     * Send message to a recipient.
     */
    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ChatMessageResponse response = chatService.sendMessage(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", response));
    }

    /**
     * Mark messages from a specific sender to the current user as read.
     */
    @PostMapping("/messages/read/{senderId}")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID senderId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        chatService.markAsRead(currentUserId, senderId);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
    }

    /**
     * Admin-only: Retrieve all conversation threads in the system.
     */
    @GetMapping("/admin/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getLatestConversations() {
        List<ConversationResponse> conversations = chatService.getLatestConversations();
        return ResponseEntity.ok(ApiResponse.success("Admin conversation logs retrieved", conversations));
    }

    /**
     * Admin-only: Retrieve conversation history between any two users.
     */
    @GetMapping("/admin/conversations/{user1Id}/{user2Id}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getAdminChatHistory(
            @PathVariable UUID user1Id,
            @PathVariable UUID user2Id) {
        List<ChatMessageResponse> history = chatService.getChatHistory(user1Id, user2Id);
        return ResponseEntity.ok(ApiResponse.success("Conversation history retrieved by admin", history));
    }
}
