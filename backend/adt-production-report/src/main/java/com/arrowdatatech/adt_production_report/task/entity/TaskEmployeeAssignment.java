package com.arrowdatatech.adt_production_report.task.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "task_employee_assignments",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_task_employee_assignments",
                columnNames = {"task_id", "user_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEmployeeAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_tea_task"))
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_tea_user"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User user;

    @Column(name = "assigned_pages")
    private Integer assignedPages;

    // Running total updated on each Stop Timer
    @Column(name = "pages_completed", nullable = false)
    @Builder.Default
    private Integer pagesCompleted = 0;

    // BUG FIX: DB constraint is ('Pending', 'In Progress', 'Completed').
    // The service was writing "FINISH" which violates the constraint.
    // Valid values: "Pending" | "In Progress" | "Completed"
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "Pending";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}