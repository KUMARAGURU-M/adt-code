package com.arrowdatatech.adt_production_report.meeting.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dev_meeting_action_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevMeetingActionItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false, foreignKey = @ForeignKey(name = "fk_meeting_action_items_meeting"))
    private DevMeeting meeting;

    @Column(name = "text", nullable = false, length = 500)
    private String text;

    @Column(name = "completed", nullable = false)
    @Builder.Default
    private boolean completed = false;
}
