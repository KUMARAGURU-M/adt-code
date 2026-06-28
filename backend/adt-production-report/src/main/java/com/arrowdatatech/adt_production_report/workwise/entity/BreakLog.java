package com.arrowdatatech.adt_production_report.workwise.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "break_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BreakLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_log_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_break_time_log"))
    private TimeLog timeLog;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_break_user"))
    private User user;

    // DB column: break_reason
    @Column(name = "break_reason", nullable = false, length = 50)
    private String breakReason;

    @Column(name = "custom_reason", columnDefinition = "TEXT")
    private String customReason;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // DB column: break_start  ← NOT start_time
    @Column(name = "break_start", nullable = false)
    private OffsetDateTime breakStart;

    // DB column: break_end  ← NOT end_time
    @Column(name = "break_end")
    private OffsetDateTime breakEnd;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}