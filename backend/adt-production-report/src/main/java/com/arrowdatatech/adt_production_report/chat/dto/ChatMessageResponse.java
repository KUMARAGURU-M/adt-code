package com.arrowdatatech.adt_production_report.chat.dto;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {

    private UUID id;
    private UUID senderId;
    private String senderName;
    private UUID recipientId;
    private String recipientName;
    private String message;
    private MediaFileDetails mediaFile;
    private Boolean isRead;
    private OffsetDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaFileDetails {
        private UUID id;
        private String originalName;
        private String mimeType;
        private Long fileSize;
        private String url;
    }
}
