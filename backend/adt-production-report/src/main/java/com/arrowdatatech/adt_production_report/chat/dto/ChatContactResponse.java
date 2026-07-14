package com.arrowdatatech.adt_production_report.chat.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatContactResponse {

    private UUID id;
    private String userCode;
    private String fullName;
    private String email;
    private String role;
    private Long unreadCount;
    private java.time.OffsetDateTime lastMessageAt;
}
