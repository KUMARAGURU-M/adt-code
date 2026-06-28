package com.arrowdatatech.adt_production_report.attendance.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "attendance_summary",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_attendance_summary_user_month",
                columnNames = {"user_id", "month"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_att_summary_user"))
    private User user;

    // First day of month e.g. 2026-05-01
    @Column(name = "month", nullable = false)
    private LocalDate month;

    @Column(name = "working_days", nullable = false)
    @Builder.Default
    private Integer workingDays = 0;

    @Column(name = "present_days", nullable = false)
    @Builder.Default
    private Integer presentDays = 0;

    @Column(name = "absent_days", nullable = false)
    @Builder.Default
    private Integer absentDays = 0;

    @Column(name = "half_days", nullable = false)
    @Builder.Default
    private Integer halfDays = 0;

    @Column(name = "paid_holidays", nullable = false)
    @Builder.Default
    private Integer paidHolidays = 0;

    @Column(name = "week_offs", nullable = false)
    @Builder.Default
    private Integer weekOffs = 0;

    // present + (half_days x 0.5) + paid_holidays
    @Column(name = "days_for_wages", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal daysForWages = BigDecimal.ZERO;

    // Immutable snapshot at computation time
    @Column(name = "base_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "per_day_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal perDaySalary = BigDecimal.ZERO;

    @Column(name = "loss_of_pay", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lossOfPay = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "incentive", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal incentive = BigDecimal.ZERO;

    @Column(name = "advance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal advance = BigDecimal.ZERO;

    @Column(name = "total_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalSalary = BigDecimal.ZERO;

    @Column(name = "salary_status", nullable = false, length = 20)
    @Builder.Default
    private String salaryStatus = "Pending";

    // Issue 4 fix - prevents modification after salary credited
    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "computed_at", nullable = false)
    private OffsetDateTime computedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}