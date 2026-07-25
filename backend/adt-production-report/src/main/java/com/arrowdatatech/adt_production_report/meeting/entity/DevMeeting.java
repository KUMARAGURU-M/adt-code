package com.arrowdatatech.adt_production_report.meeting.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.project.entity.DevProject;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "dev_meetings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevMeeting extends BaseEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_dev_meetings_project"))
    private DevProject project;

    @Column(name = "meeting_date", nullable = false)
    @Builder.Default
    private LocalDate meetingDate = LocalDate.now();

    @Column(name = "time_block", nullable = false, length = 100)
    private String timeBlock;

    @Column(name = "location")
    private String location;

    @Column(name = "agenda", length = 500)
    private String agenda;

    @Column(name = "discussion", columnDefinition = "TEXT")
    private String discussion;

    @Column(name = "decisions", columnDefinition = "TEXT")
    private String decisions; // Semicolon separated values or simple text

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "dev_meeting_attendees",
        joinColumns = @JoinColumn(name = "meeting_id", foreignKey = @ForeignKey(name = "fk_meeting_attendee_meeting")),
        inverseJoinColumns = @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_meeting_attendee_user"))
    )
    @Builder.Default
    private Set<User> attendees = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", foreignKey = @ForeignKey(name = "fk_dev_meetings_created_by"))
    private User createdBy;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<DevMeetingActionItem> actionItems = new HashSet<>();
}
