package com.arrowdatatech.adt_production_report.chat.scheduler;

import com.arrowdatatech.adt_production_report.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatCleanupScheduler {

    private final ChatService chatService;

    /**
     * Run daily at midnight to delete chat logs older than 15 days.
     * Cron expression: "0 0 0 * * ?" (Midnight every day)
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldChatData() {
        log.info("Starting scheduled cleanup of chat logs older than 15 days...");
        try {
            chatService.cleanupOldMessages();
            log.info("Scheduled cleanup of old chat logs completed successfully.");
        } catch (Exception e) {
            log.error("Failed to run scheduled cleanup of old chat logs: {}", e.getMessage(), e);
        }
    }
}
