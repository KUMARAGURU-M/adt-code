package com.arrowdatatech.adt_production_report.leave.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "leave_balances",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_leave_balance",
                columnNames = {"user_id","leave_type_id","year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_lb_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_type_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_lb_leave_type"))
    private LeaveType leaveType;

    @Column(name = "year", nullable = false)
    private Short year;

    @Column(name = "total_allocated", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal totalAllocated = BigDecimal.ZERO;

    @Column(name = "used", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal used = BigDecimal.ZERO;

    @Column(name = "pending", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal pending = BigDecimal.ZERO;

    @Column(name = "carried_forward", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal carriedForward = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // Computed: available = totalAllocated + carriedForward - used - pending
    @Transient
    public BigDecimal getAvailable() {
        return totalAllocated
                .add(carriedForward)
                .subtract(used)
                .subtract(pending);
    }
}