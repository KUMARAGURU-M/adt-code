package com.arrowdatatech.adt_production_report.shift.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "shift_user_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftUserAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // ManyToOne: many shift assignments -> one shift
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_shift_assignment_shift"))
    private Shift shift;

    // ManyToOne: many shift assignments -> one user
    // @NotFound(IGNORE): if user is soft-deleted (@SQLRestriction filters them),
    // Hibernate returns null instead of throwing EntityNotFoundException
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_shift_assignment_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "assigned_by",
            foreignKey = @ForeignKey(name = "fk_shift_assignment_by"))
    private User assignedBy;

    @Column(name = "effective_from", nullable = false)
    @Builder.Default
    private LocalDate effectiveFrom = LocalDate.now();

    // NULL means currently active assignment
    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}