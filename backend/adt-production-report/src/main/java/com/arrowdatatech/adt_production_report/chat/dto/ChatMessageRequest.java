package com.arrowdatatech.adt_production_report.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    private String message;

    private UUID mediaFileId;
}
