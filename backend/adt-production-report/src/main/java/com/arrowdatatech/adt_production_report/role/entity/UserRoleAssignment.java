package com.arrowdatatech.adt_production_report.role.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "user_role_assignments",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_role_assignments",
                columnNames = {"user_id", "role_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoleAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // ManyToOne: many assignments -> one user
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ura_user"))
    private User user;

    // ManyToOne: many assignments -> one role
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ura_role"))
    private Role role;

    // Who assigned this role
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by",
            foreignKey = @ForeignKey(name = "fk_ura_assigned_by"))
    private User assignedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}