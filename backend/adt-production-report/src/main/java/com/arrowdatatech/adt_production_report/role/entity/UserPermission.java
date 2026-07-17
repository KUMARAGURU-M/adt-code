package com.arrowdatatech.adt_production_report.role.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.arrowdatatech.adt_production_report.user.entity.User;

@Entity
@Table(name = "user_permissions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_permissions",
                columnNames = {"user_id", "permission_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_up_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "permission_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_up_permission"))
    private Permission permission;

    @Column(name = "is_denied", nullable = false)
    @Builder.Default
    private Boolean isDenied = false;

    @CreationTimestamp
    @Column(name = "granted_at", updatable = false, nullable = false)
    private OffsetDateTime grantedAt;
}

