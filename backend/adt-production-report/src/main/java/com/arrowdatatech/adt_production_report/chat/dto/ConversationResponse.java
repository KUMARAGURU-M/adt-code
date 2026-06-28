package com.arrowdatatech.adt_production_report.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {

    private ChatContactResponse user1;
    private ChatContactResponse user2;
    private ChatMessageResponse lastMessage;
    private Long messageCount;
}
