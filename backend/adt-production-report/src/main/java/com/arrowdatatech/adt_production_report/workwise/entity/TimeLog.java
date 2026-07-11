package com.arrowdatatech.adt_production_report.workwise.entity;

import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.shift.entity.Shift;
import com.arrowdatatech.adt_production_report.task.entity.Task;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "time_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_tl_user"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id",
            foreignKey = @ForeignKey(name = "fk_tl_task"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "project_id", nullable = true,
            foreignKey = @ForeignKey(name = "fk_tl_project"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id",
            foreignKey = @ForeignKey(name = "fk_tl_process"))
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id",
            foreignKey = @ForeignKey(name = "fk_tl_job"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Job job;

    // DB column: shift_id — FK to shifts table, NOT a varchar column
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id",
            foreignKey = @ForeignKey(name = "fk_tl_shift"))
    private Shift shift;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @Column(name = "elapsed_seconds", nullable = false)
    @Builder.Default
    private Integer elapsedSeconds = 0;

    @Column(name = "working_seconds", nullable = false)
    @Builder.Default
    private Integer workingSeconds = 0;

    @Column(name = "break_seconds", nullable = false)
    @Builder.Default
    private Integer breakSeconds = 0;

    @Column(name = "pages_completed", nullable = false)
    @Builder.Default
    private Integer pagesCompleted = 0;

    @Column(name = "mark_task_completed", nullable = false)
    @Builder.Default
    private Boolean markTaskCompleted = false;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "Running";

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "timeLog", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BreakLog> breakLogs = new HashSet<>();

    // ── Transient helper — not a DB column ──────────
    // Returns shift name without extra DB query
    @Transient
    public String getShiftName() {
        return shift != null ? shift.getName() : null;
    }
}




